"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewPage() {
  const router = useRouter();
  const [problemText, setProblemText] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [mode, setMode] = useState("");

  useEffect(() => {
    const p = localStorage.getItem("problemText") ?? "";
    const s = localStorage.getItem("solutionText") ?? "";
    const m = localStorage.getItem("mode") ?? "";
    if (!p) {
      router.push("/");
      return;
    }
    setProblemText(p);
    setSolutionText(s);
    setMode(m);
  }, [router]);

  const handleConfirm = () => {
    localStorage.setItem("problemText", problemText);
    // solutionText state starts as "" and is set asynchronously by useEffect.
    // On Vercel static pages the timing can differ from local dev, so fall back
    // to the value already stored by the home page rather than overwriting with "".
    const solToSave = solutionText !== ""
      ? solutionText
      : (localStorage.getItem("solutionText") ?? "");
    localStorage.setItem("solutionText", solToSave);
    console.log("[review] saving problemText length:", problemText.length, "solutionText length:", solToSave.length);
    router.push("/explain");
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            ← 戻る
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1565C0]">テキストの確認・修正</h1>
            <p className="text-xs text-gray-500">
              OCRの結果を確認して、誤りがあれば修正してください
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 mb-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              問題文
            </label>
            <textarea
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm text-gray-800 shadow-sm outline-none focus:border-blue-400 resize-y"
              placeholder="問題文が入ります..."
            />
          </div>

          {mode === "problem-and-solution" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                解説
              </label>
              <textarea
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
                rows={10}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm text-gray-800 shadow-sm outline-none focus:border-blue-400 resize-y"
                placeholder="解説が入ります..."
              />
            </div>
          )}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!problemText.trim()}
          className="w-full rounded-xl bg-[#1565C0] py-4 text-base font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          この内容で理解する
        </button>
      </div>
    </main>
  );
}
