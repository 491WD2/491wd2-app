/**
 * Compress bitmap images for safe localStorage-backed storage (data URLs).
 */

export type CompressImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  /** JPEG quality 0–1 */
  quality?: number;
  /** If result exceeds this size (bytes), quality is stepped down */
  maxBytes?: number;
};

const DEFAULT_MAX_W = 960;
const DEFAULT_MAX_H = 960;
const DEFAULT_QUALITY = 0.82;
const DEFAULT_MAX_BYTES = 420_000;

export async function compressImageFileToDataUrl(
  file: File,
  options?: CompressImageOptions,
): Promise<string> {
  const maxWidth = options?.maxWidth ?? DEFAULT_MAX_W;
  const maxHeight = options?.maxHeight ?? DEFAULT_MAX_H;
  let quality = options?.quality ?? DEFAULT_QUALITY;
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;

  const { source, width: srcW, height: srcH } = await loadImageSource(file);
  const { width, height } = scaleToFit(srcW, srcH, maxWidth, maxHeight);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    disposeImageSource(source);
    throw new Error("Could not prepare image canvas.");
  }
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  disposeImageSource(source);

  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  if (estimateDataUrlBytes(dataUrl) > maxBytes && quality > 0.55) {
    quality = Math.max(0.55, quality - 0.15);
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (estimateDataUrlBytes(dataUrl) > maxBytes && quality > 0.45) {
    quality = 0.45;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  return dataUrl;
}

function estimateDataUrlBytes(dataUrl: string) {
  const idx = dataUrl.indexOf(",");
  if (idx === -1) {
    return dataUrl.length * 0.75;
  }
  const b64 = dataUrl.slice(idx + 1).replace(/\s/g, "");
  return Math.floor((b64.length * 3) / 4);
}

async function loadImageSource(file: File): Promise<{
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
      };
    } catch {
      // fall through to HTMLImageElement
    }
  }
  const img = await loadHtmlImageFromFile(file);
  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

function disposeImageSource(source: ImageBitmap | HTMLImageElement) {
  if ("close" in source && typeof source.close === "function") {
    source.close();
  }
}

function loadHtmlImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image."));
    };
    img.src = url;
  });
}

function scaleToFit(srcW: number, srcH: number, maxW: number, maxH: number) {
  if (srcW <= maxW && srcH <= maxH) {
    return { width: srcW, height: srcH };
  }
  const r = Math.min(maxW / srcW, maxH / srcH);
  return {
    width: Math.max(1, Math.round(srcW * r)),
    height: Math.max(1, Math.round(srcH * r)),
  };
}
