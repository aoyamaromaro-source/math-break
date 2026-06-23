export function encodeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip "data:image/jpeg;base64," prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface CompressedImage {
  base64: string;
  mediaType: string;
  originalBytes: number;
  compressedBytes: number;
}

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)}MB`
    : `${Math.round(bytes / 1024)}KB`;
}

// Resize to at most 800px on the long side and re-encode as JPEG at 60% quality.
// Falls back to raw base64 when the browser cannot decode the format (e.g. HEIC on desktop).
export async function compressImage(file: File): Promise<CompressedImage> {
  const originalMediaType = getMediaType(file);
  const originalBytes = file.size;

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const MAX_SIDE = 800;
      let w = img.naturalWidth;
      let h = img.naturalHeight;

      if (w > MAX_SIDE || h > MAX_SIDE) {
        if (w >= h) {
          h = Math.round((h / w) * MAX_SIDE);
          w = MAX_SIDE;
        } else {
          w = Math.round((w / h) * MAX_SIDE);
          h = MAX_SIDE;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      const base64 = dataUrl.split(",")[1];
      const compressedBytes = Math.round(base64.length * 3 / 4);

      console.log(
        `[compressImage] ${file.name}: ${formatBytes(originalBytes)} → ${formatBytes(compressedBytes)}`
      );

      resolve({ base64, mediaType: "image/jpeg", originalBytes, compressedBytes });
    };

    img.onerror = async () => {
      // Browser cannot decode this format — send raw and let the server handle it
      URL.revokeObjectURL(url);
      const raw = await encodeImageToBase64(file);
      const compressedBytes = Math.round(raw.length * 3 / 4);

      console.log(
        `[compressImage] ${file.name} (fallback): ${formatBytes(originalBytes)} → ${formatBytes(compressedBytes)}`
      );

      resolve({ base64: raw, mediaType: originalMediaType, originalBytes, compressedBytes });
    };

    img.src = url;
  });
}

export function getMediaType(file: File): string {
  const type = file.type.toLowerCase();
  if (type === "image/png") return "image/png";
  if (type === "image/webp") return "image/webp";
  if (type === "image/gif") return "image/gif";
  // HEIC/HEIF: pass through so the server-side converter handles it
  if (type === "image/heic" || type === "image/heif") return "image/heic";
  // iOS may report no type for .heic files — detect by extension
  if (file.name.toLowerCase().endsWith(".heic")) return "image/heic";
  if (file.name.toLowerCase().endsWith(".heif")) return "image/heic";
  return "image/jpeg";
}
