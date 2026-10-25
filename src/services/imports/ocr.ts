// Optional OCR for scanned pages. tesseract.js is loaded on demand and fetches
// its language model over the network on first use — so OCR needs connectivity
// even though the recognition itself runs locally in the browser. Results can
// misread names, dates and numbers and must always be reviewed.

export interface OcrProgress {
  status: string;
  progress: number; // 0..1
}

export async function ocrCanvas(
  canvas: HTMLCanvasElement,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: (m: { status: string; progress: number }) => onProgress?.({ status: m.status, progress: m.progress }),
  });
  try {
    const { data } = await worker.recognize(canvas);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
