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
