import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic, OCR_SYSTEM } from "@/lib/anthropic";
import { convertHeicToJpeg } from "@/lib/heicUtils";

type SupportedMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

interface ImagePayload {
  data: string;
  mediaType: string;
}

async function normalizeImage(img: ImagePayload): Promise<{ data: string; mediaType: SupportedMediaType }> {
  const isHeic =
    img.mediaType === "image/heic" ||
    img.mediaType === "image/heif" ||
    img.mediaType === "";

  if (isHeic) {
    const inputBuffer = Buffer.from(img.data, "base64");
    const jpegBuffer = await convertHeicToJpeg(inputBuffer);
    return { data: jpegBuffer.toString("base64"), mediaType: "image/jpeg" };
  }

  return { data: img.data, mediaType: img.mediaType as SupportedMediaType };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { problemImage, solutionImage, mode } = body;

    const imageContents: Anthropic.ImageBlockParam[] = [];

    if (problemImage) {
      const normalized = await normalizeImage(problemImage);
      imageContents.push({
        type: "image",
        source: {
          type: "base64",
          media_type: normalized.mediaType,
          data: normalized.data,
        },
      });
    }

    if (solutionImage && mode === "problem-and-solution") {
      const normalized = await normalizeImage(solutionImage);
      imageContents.push({
        type: "image",
        source: {
          type: "base64",
          media_type: normalized.mediaType,
          data: normalized.data,
        },
      });
    }

    const userMessage =
      mode === "problem-and-solution"
        ? "この画像から数学の問題文と解説をテキストに変換してください。問題文は【問題】、解説は【解説】のラベルをつけて区別してください。"
        : "この画像から数学の問題文をテキストに変換してください。【問題】のラベルをつけてください。";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: OCR_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            ...imageContents,
            { type: "text", text: userMessage },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const problemMatch = text.match(/【問題】([\s\S]*?)(?=【解説】|$)/);
    const solutionMatch = text.match(/【解説】([\s\S]*?)$/);

    const problemText = problemMatch ? problemMatch[1].trim() : text.trim();
    const solutionText = solutionMatch ? solutionMatch[1].trim() : "";

    return NextResponse.json({ problemText, solutionText });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json(
      { error: "OCRの処理中にエラーが発生しました。もう一度試してね。" },
      { status: 500 }
    );
  }
}
