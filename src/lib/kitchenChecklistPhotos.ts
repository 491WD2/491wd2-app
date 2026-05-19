/**
 * Client-side JPEG compression for kitchen checklist reference photos (localStorage-safe).
 */

export type CompressJpegResult =
  | { ok: true; dataUrl: string }
  | { ok: false; reason: "not_jpeg" | "decode_failed" | "too_large" | "canvas" };

const MAX_STORE_CHAR_LENGTH = 1_150_000;

export function validateJpegFile(file: File): boolean {
  if (file.type === "image/jpeg") {
    return true;
  }
  return /\.jpe?g$/i.test(file.name);
}

/**
 * Reads a JPEG file, downscales to max width, re-encodes with adjustable quality.
 */
export async function compressJpegFileToDataUrl(
  file: File,
  options?: { maxWidth?: number; initialQuality?: number },
): Promise<CompressJpegResult> {
  if (!validateJpegFile(file)) {
    return { ok: false, reason: "not_jpeg" };
  }

  const maxWidth = options?.maxWidth ?? 1200;
  let quality = options?.initialQuality ?? 0.82;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { ok: false, reason: "decode_failed" };
  }

  try {
    const scale = Math.min(1, maxWidth / bitmap.width);
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { ok: false, reason: "canvas" };
    }
    ctx.drawImage(bitmap, 0, 0, w, h);

    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > 950_000 && quality > 0.48) {
      quality -= 0.07;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    if (dataUrl.length > MAX_STORE_CHAR_LENGTH) {
      return { ok: false, reason: "too_large" };
    }

    return { ok: true, dataUrl };
  } finally {
    bitmap.close();
  }
}
