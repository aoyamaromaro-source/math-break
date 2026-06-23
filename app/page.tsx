"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";
import { compressImage, CompressedImage } from "@/lib/textUtils";
import { AppMode } from "@/types";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<AppMode>("problem-and-solution");
  const [problemFile, setProblemFile] = useState<File | null>(null);
  const [problemCompressed, setProblemCompressed] = useState<CompressedImage | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [solutionCompressed, setSolutionCompressed] = useState<CompressedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleProblemSelect = async (file: File | null) => {
    setProblemFile(file);
    setProblemCompressed(null);
    if (file) setProblemCompressed(await compressImage(file));
  };

  const handleSolutionSelect = async (file: File | null) => {
    setSolutionFile(file);
    setSolutionCompressed(null);
    if (file) setSolutionCompressed(await compressImage(file));
  };

  const handleStart = async () => {
    if (!problemFile) {
      setError("問題の画像を選択してください。");
      return;
    }
    if (mode === "problem-and-solution" && !solutionFile) {
      setError("解説の画像を選択してください。");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const problem = problemCompressed ?? (await compressImage(problemFile));
      const problemData = problem.base64;
      const problemMediaType = problem.mediaType;

      let solutionData: string | undefined;
      let solutionMediaType: string | undefined;
      if (mode === "problem-and-solution" && solutionFile) {
        const solution = solutionCompressed ?? (await compressImage(solutionFile));
        solutionData = solution.base64;
        solutionMediaType = solution.mediaType;
      }

      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          problemImage: { data: problemData, mediaType: problemMediaType },
          solutionImage: solutionData
            ? { data: solutionData, mediaType: solutionMediaType }
            : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "エラーが発生しました。もう一度試してね。");
        setLoading(false);
        return;
      }

      const { problemText, solutionText } = await res.json();

      sessionStorage.setItem("problemText", problemText);
      sessionStorage.setItem("solutionText", solutionText);
      sessionStorage.setItem("mode", mode);

      router.push("/review");
    } catch {
      setError("エラーが発生しました。もう一度試してね。");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8] px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#1565C0]">MathBreak</h1>
          <p className="mt-2 text-sm text-gray-500">
            わからない数学の問題・解説を写真で撮って、AI先生に説明してもらおう！
          </p>
        </div>

        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-gray-700">モードを選択してください</p>
          <div className="flex gap-3">
            <button
              onClick={() => setMode("problem-only")}
              className={`flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-colors ${
                mode === "problem-only"
                  ? "border-[#1565C0] bg-blue-50 text-[#1565C0]"
                  : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"
              }`}
            >
              問題のみ
            </button>
            <button
              onClick={() => setMode("problem-and-solution")}
              className={`flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-colors ${
                mode === "problem-and-solution"
                  ? "border-[#1565C0] bg-blue-50 text-[#1565C0]"
                  : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"
              }`}
            >
              問題＋解説
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-5 mb-6">
          <ImageUploader
            label="問題の画像"
            file={problemFile}
            onImageSelect={handleProblemSelect}
            compressionInfo={problemCompressed ?? undefined}
          />
          {mode === "problem-and-solution" && (
            <ImageUploader
              label="解説の画像"
              file={solutionFile}
              onImageSelect={handleSolutionSelect}
              compressionInfo={solutionCompressed ?? undefined}
            />
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full rounded-xl bg-[#1565C0] py-4 text-base font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              文字起こし中...
            </span>
          ) : (
            "文字起こし開始"
          )}
        </button>
      </div>
    </main>
  );
}
