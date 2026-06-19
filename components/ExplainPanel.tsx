"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Message } from "@/types";
import QuickActionButtons from "./QuickActionButtons";
import MathRenderer from "./MathRenderer";

interface ExplainPanelProps {
  problemText: string;
  solutionText: string;
  highlightedText: string;
  onReset: () => void;
}

export default function ExplainPanel({
  problemText,
  solutionText,
  highlightedText,
  onReset,
}: ExplainPanelProps) {
  const [history, setHistory] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState("");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasExplained = useRef(false);

  // Auto-explain when highlightedText changes
  useEffect(() => {
    if (highlightedText && !loading) {
      hasExplained.current = false;
      setHistory([]);
      setStreaming("");
      setError("");
      explain(highlightedText, undefined, []);
      hasExplained.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedText]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streaming, history]);

  const explain = async (
    highlighted: string,
    userQuestion?: string,
    currentHistory?: Message[]
  ) => {
    setLoading(true);
    setError("");
    setStreaming("");

    const hist = currentHistory ?? history;

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemText,
          solutionText,
          highlightedText: highlighted,
          userQuestion,
          history: hist,
        }),
      });

      if (!res.ok) {
        setError("説明の生成中にエラーが発生しました。もう一度試してね。");
        setLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setStreaming(full);
      }

      const userMsg: Message = {
        role: "user",
        content: userQuestion
          ? `【わからない部分】${highlighted}\n【質問】${userQuestion}`
          : `【わからない部分】${highlighted}`,
      };
      const assistantMsg: Message = { role: "assistant", content: full };
      setHistory([...hist, userMsg, assistantMsg]);
      setStreaming("");
    } catch {
      setError("通信エラーが発生しました。もう一度試してね。");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    explain(highlightedText, q);
  };

  const handleMoreDetail = () => {
    explain(highlightedText, "もっと詳しく、具体的に教えてください。");
  };

  const handleRephrase = () => {
    explain(highlightedText, "別の言い方や例えを使って説明してください。");
  };

  const handleReset = () => {
    setHistory([]);
    setStreaming("");
    setError("");
    setInput("");
    onReset();
  };

  if (!highlightedText) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl bg-green-50 p-6 text-center">
        <svg
          className="h-10 w-10 text-green-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-sm text-gray-500">
          上のテキストをなぞってハイライトし、
          <br />
          「この部分を説明して」ボタンを押してね！
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-xl bg-green-50">
      {/* Header */}
      <div className="border-b border-green-200 px-4 py-3">
        <p className="text-xs font-medium text-green-800">AI先生の説明</p>
        <p className="mt-1 line-clamp-2 rounded bg-yellow-100 px-2 py-1 text-xs text-gray-700">
          「{highlightedText}」について
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {history.map((msg, i) =>
          msg.role === "assistant" ? (
            <div
              key={i}
              className="rounded-lg bg-white p-3 shadow-sm text-sm text-gray-800 leading-loose"
            >
              <MathRenderer text={msg.content} />
            </div>
          ) : null
        )}

        {streaming && (
          <div className="rounded-lg bg-white p-3 shadow-sm text-sm text-gray-800 leading-loose">
            <MathRenderer text={streaming} />
            <span className="inline-block h-4 w-1 animate-pulse bg-blue-500 ml-0.5" />
          </div>
        )}

        {loading && !streaming && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="animate-spin">⟳</span> 考え中...
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      {history.length > 0 && (
        <div className="border-t border-green-200 px-4 py-2">
          <QuickActionButtons
            onMoreDetail={handleMoreDetail}
            onRephrase={handleRephrase}
            onReset={handleReset}
            disabled={loading}
          />
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-green-200 p-3 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="さらに質問する..."
          disabled={loading}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          送信
        </button>
      </form>
    </div>
  );
}
