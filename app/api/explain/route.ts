import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic, EXPLAIN_SYSTEM } from "@/lib/anthropic";
import { ExplainRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: ExplainRequest = await request.json();
    const { problemText, solutionText, highlightedText, userQuestion, history } = body;

    const userContent = `【問題文】
${problemText}

${solutionText ? `【解説全体】\n${solutionText}\n\n` : ""}【わからない部分】
${highlightedText}

${userQuestion ? `【質問】${userQuestion}` : "この部分を偏差値45〜50の生徒にわかるように説明してください。"}`;

    const messages: Anthropic.MessageParam[] = [
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      {
        role: "user",
        content: userContent,
      },
    ];

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: EXPLAIN_SYSTEM,
      messages,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(
              new TextEncoder().encode(chunk.delta.text)
            );
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Explain error:", error);
    return new Response(
      "説明の生成中にエラーが発生しました。もう一度試してね。",
      { status: 500 }
    );
  }
}
