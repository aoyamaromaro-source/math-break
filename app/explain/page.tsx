"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import TextViewer, { HighlightRange } from "@/components/TextViewer";
import ExplainPanel from "@/components/ExplainPanel";

export default function ExplainPage() {
  const router = useRouter();
  const [problemText, setProblemText] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [highlights, setHighlights] = useState<HighlightRange[]>([]);
  const [activeHighlight, setActiveHighlight] = useState("");
  const [pendingText, setPendingText] = useState("");
  const [showExplainBtn, setShowExplainBtn] = useState(false);

  useEffect(() => {
    const p = sessionStorage.getItem("problemText") ?? "";
    const s = sessionStorage.getItem("solutionText") ?? "";
    console.log("[explain] loaded from sessionStorage — problemText length:", p.length, "solutionText length:", s.length);
    if (!p) {
      router.push("/");
      return;
    }
    setProblemText(p);
    setSolutionText(s);
  }, [router]);

  const handleHighlight = useCallback((text: string) => {
    setPendingText(text);
    setShowExplainBtn(true);
  }, []);

  const handleExplainRequest = () => {
    if (!pendingText) return;

    const source: "problem" | "solution" = problemText.includes(pendingText)
      ? "problem"
      : "solution";

    setHighlights((prev) => {
      const exists = prev.some((h) => h.text === pendingText);
      if (exists) return prev;
      return [
        ...prev,
        { text: pendingText, start: 0, end: 0, source },
      ];
    });

    setActiveHighlight(pendingText);
    setShowExplainBtn(false);
    setPendingText("");
  };

  const handleHighlightClick = (index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setActiveHighlight("");
    setHighlights([]);
    setPendingText("");
    setShowExplainBtn(false);
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => router.push("/review")}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          ← 戻る
        </button>
        <h1 className="text-base font-bold text-[#1565C0]">MathBreak</h1>
        <p className="text-xs text-gray-400">テキストをなぞってハイライトしよう</p>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">
        {/* Text area (top / left) */}
        <div className="flex-1 overflow-y-auto p-4 lg:w-1/2">
          <TextViewer
            problemText={problemText}
            solutionText={solutionText}
            highlights={highlights}
            onHighlight={handleHighlight}
            onHighlightClick={handleHighlightClick}
          />

          {/* Pending highlight action button */}
          {showExplainBtn && pendingText && (
            <div className="sticky bottom-4 mt-4 flex justify-center">
              <button
                onClick={handleExplainRequest}
                className="rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-gray-800 shadow-lg hover:bg-yellow-300 transition-colors animate-bounce"
              >
                「{pendingText.slice(0, 20)}{pendingText.length > 20 ? "…" : ""}」を説明して
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-gray-200" />
        <div className="lg:hidden h-px bg-gray-200" />

        {/* Explain panel (bottom / right) */}
        <div className="lg:w-1/2 p-4 flex flex-col" style={{ minHeight: "50vh" }}>
          <ExplainPanel
            problemText={problemText}
            solutionText={solutionText}
            highlightedText={activeHighlight}
            onReset={handleReset}
          />
        </div>
      </div>
    </main>
  );
}
