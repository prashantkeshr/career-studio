import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { buildDocFromBlocks, type ExtractedDoc, type ImportBlock } from './docxImport';

// PDF → resume reconstruction. Text is extracted from the PDF's text layer
// (pdf.js); for scanned PDFs an optional OCR path is offered. Visual layout is
// NOT preserved — the output is reconstructed into the app's own model and
// reviewed before anything is created. pdf.js is loaded on demand.

let workerSet = false;
async function getPdfjs() {
  const m = await import('pdfjs-dist');
  if (!workerSet) {
    m.GlobalWorkerOptions.workerSrc = workerUrl;
    workerSet = true;
  }
  return m;
}

const SECTION_RE = /^(summary|profile|objective|about|experience|employment|work|education|academic|skills|technical skills|competencies|projects|certifications?|licenses?|awards?|publications?|languages?|volunteering|interests|references)\b/i;

function isAllCapsShort(t: string): boolean {
  return /^[A-Z0-9 &/,'().:-]{2,32}$/.test(t) && /[A-Z]/.test(t);
}

function isHeadingLine(text: string, height: number, medianHeight: number): boolean {
  const t = text.trim();
  if (!t || t.length > 60) return false;
  if (SECTION_RE.test(t)) return true;
  if (height >= medianHeight * 1.18 && t.split(/\s+/).length <= 6) return true;
  return isAllCapsShort(t);
}

interface TextItemLike {
  str?: string;
  transform?: number[];
  height?: number;
}

export interface PdfExtractResult extends ExtractedDoc {
  scanned: boolean;
}

/** Extract from the PDF text layer. */
export async function extractPdfText(file: File): Promise<PdfExtractResult> {
  const pdfjs = await getPdfjs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data: bytes }).promise;

  const lines: { text: string; height: number }[] = [];
  let totalChars = 0;

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Group text items into visual lines by their y position.
    const rows = new Map<number, { x: number; str: string; h: number }[]>();
    for (const raw of content.items as TextItemLike[]) {
      const str = raw.str;
      if (!str || !str.trim() || !raw.transform) continue;
      const y = Math.round(raw.transform[5]);
      const x = raw.transform[4];
      const h = raw.height || Math.abs(raw.transform[3]) || 10;
      let bucket = y;
      for (const k of rows.keys()) { if (Math.abs(k - y) <= 2) { bucket = k; break; } }
      if (!rows.has(bucket)) rows.set(bucket, []);
      rows.get(bucket)!.push({ x, str, h });
    }
    const sorted = [...rows.entries()].sort((a, b) => b[0] - a[0]); // top of page first
    for (const [, items] of sorted) {
      items.sort((a, b) => a.x - b.x);
      const text = items.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      lines.push({ text, height: Math.max(...items.map((i) => i.h)) });
      totalChars += text.length;
    }
  }

  const scanned = totalChars < 40 * doc.numPages;
  const heights = lines.map((l) => l.height).sort((a, b) => a - b);
  const median = heights.length ? heights[Math.floor(heights.length / 2)] : 10;

  const blocks: ImportBlock[] = lines.map((l) => {
    if (/^[•\-*·◦]/.test(l.text)) return { kind: 'bullet', text: l.text.replace(/^[•\-*·◦]\s*/, '') };
    return { kind: isHeadingLine(l.text, l.height, median) ? 'heading' : 'para', text: l.text };
  });

  const warnings: string[] = [];
  if (scanned) warnings.push('This PDF appears to be scanned (little selectable text). Try the OCR option for a better result.');
  warnings.push('PDF layout is not preserved — review the detected sections carefully.');

  return { ...buildDocFromBlocks(blocks, warnings), scanned };
}

/** Extract by rendering pages and running OCR (for scanned PDFs). */
export async function extractPdfViaOcr(
  file: File,
  onProgress?: (message: string, fraction: number) => void,
): Promise<ExtractedDoc> {
  const pdfjs = await getPdfjs();
  const { ocrCanvas } = await import('./ocr');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const maxPages = Math.min(doc.numPages, 5);
  const allLines: string[] = [];

  for (let p = 1; p <= maxPages; p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const text = await ocrCanvas(canvas, (prog) => onProgress?.(`Page ${p}/${maxPages}: ${prog.status}`, prog.progress));
    for (const ln of text.split('\n')) if (ln.trim()) allLines.push(ln.trim());
  }

  const blocks: ImportBlock[] = allLines.map((t) => {
    if (/^[•\-*·◦]/.test(t)) return { kind: 'bullet', text: t.replace(/^[•\-*·◦]\s*/, '') };
    const heading = SECTION_RE.test(t) || isAllCapsShort(t);
    return { kind: heading ? 'heading' : 'para', text: t };
  });

  const warnings = ['Text was recognised with OCR and may contain errors — review names, dates, numbers and emails carefully.'];
  if (doc.numPages > maxPages) warnings.push(`Only the first ${maxPages} pages were processed.`);
  return buildDocFromBlocks(blocks, warnings);
}
