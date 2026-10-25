// Downscale an uploaded image to a sane max width and return a data URL.
// Keeps IndexedDB storage and exported ZIPs small. Runs entirely in-browser.

export async function fileToResizedDataUrl(file: File, maxW = 1280, quality = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('Could not read image.'));
      im.src = url;
    });
    const scale = Math.min(1, maxW / (img.width || maxW));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    const png = /png/i.test(file.type);
    return canvas.toDataURL(png ? 'image/png' : 'image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
