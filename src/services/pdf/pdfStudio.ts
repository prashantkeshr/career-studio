import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { uid } from '../../core/models/factory';

// ---------------------------------------------------------------------------
// PDF Studio engine. pdf.js renders page thumbnails; pdf-lib performs the real
// page operations and writes the output file. All local — nothing is uploaded.
// The editing model is non-destructive: a list of page references pointing at
// one or more loaded source documents, each with an added rotation. The source
// files are never mutated; export builds a fresh document.
// ---------------------------------------------------------------------------

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface PdfSource {
  id: string;
  name: string;
  bytes: Uint8Array; // kept for pdf-lib; never handed (unsliced) to pdf.js
  doc: PDFDocumentProxy;
  pageCount: number;
}

export interface PageRef {
  id: string;
  srcId: string;
  index: number; // 0-based page index within the source
  rotation: number; // added rotation in degrees (0/90/180/270)
}

export class PdfError extends Error {}

/** Load a File into a source document (pdf.js proxy + bytes for pdf-lib). */
export async function loadSource(file: File): Promise<{ source: PdfSource; pages: PageRef[] }> {
  if (!/\.pdf$/i.test(file.name)) throw new PdfError('Please choose a .pdf file.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  let doc: PDFDocumentProxy;
  try {
    // pdf.js may detach the buffer it is given, so hand it a copy.
    doc = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
  } catch (e) {
    const msg = String((e as Error)?.message ?? '');
    if (/password/i.test(msg)) throw new PdfError('This PDF is password-protected. Remove the password and try again.');
    throw new PdfError('Could not open this PDF. It may be corrupted or an unsupported format.');
  }
  const source: PdfSource = { id: uid('src'), name: file.name, bytes, doc, pageCount: doc.numPages };
  const pages: PageRef[] = Array.from({ length: doc.numPages }, (_, i) => ({ id: uid('pg'), srcId: source.id, index: i, rotation: 0 }));
  return { source, pages };
}

/** Render a page thumbnail to a PNG data URL at the given target width. */
export async function renderThumb(source: PdfSource, ref: PageRef, width = 150): Promise<string> {
  const page = await source.doc.getPage(ref.index + 1);
  const base = page.getViewport({ scale: 1, rotation: (page.rotate + ref.rotation) % 360 });
  const scale = width / base.width;
  const viewport = page.getViewport({ scale, rotation: (page.rotate + ref.rotation) % 360 });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/png');
}

/** Build a new PDF (bytes) from the given page refs, applying rotations. */
export async function buildPdf(sources: Map<string, PdfSource>, pages: PageRef[]): Promise<Uint8Array> {
  const { PDFDocument, degrees } = await import('pdf-lib');
  const out = await PDFDocument.create();
  // Load each needed source into pdf-lib once.
  const libDocs = new Map<string, Awaited<ReturnType<typeof PDFDocument.load>>>();
  for (const srcId of new Set(pages.map((p) => p.srcId))) {
    const src = sources.get(srcId);
    if (!src) continue;
    libDocs.set(srcId, await PDFDocument.load(src.bytes));
  }
  for (const ref of pages) {
    const lib = libDocs.get(ref.srcId);
    if (!lib) continue;
    const [copied] = await out.copyPages(lib, [ref.index]);
    if (ref.rotation % 360 !== 0) {
      const current = copied.getRotation().angle;
      copied.setRotation(degrees((current + ref.rotation) % 360));
    }
    out.addPage(copied);
  }
  return out.save();
}

export function downloadBytes(filename: string, bytes: Uint8Array): void {
  const copy = bytes.slice();
  const blob = new Blob([copy], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
