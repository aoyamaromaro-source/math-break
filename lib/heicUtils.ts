// heic-convert is a CommonJS module; dynamic import avoids ESM/CJS boundary issues
export async function convertHeicToJpeg(inputBuffer: Buffer): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const convert = require("heic-convert") as (opts: {
    buffer: Buffer;
    format: "JPEG" | "PNG";
    quality: number;
  }) => Promise<ArrayBuffer>;

  const outputBuffer = await convert({
    buffer: inputBuffer,
    format: "JPEG",
    quality: 0.92,
  });

  return Buffer.from(outputBuffer);
}
