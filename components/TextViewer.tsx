"use client";

import { useRef } from "react";
import MathRenderer from "./MathRenderer";

interface TextViewerProps {
  problemText: string;
  solutionText: string;
  highlights: HighlightRange[];
  onHighlight: (text: string) => void;
  onHighlightClick: (index: number) => void;
}

export interface HighlightRange {
  text: string;
  start: number;
  end: number;
  source: "problem" | "solution";
}

export default function TextViewer({
  problemText,
  solutionText,
  highlights,
  onHighlight,
  onHighlightClick,
}: TextViewerProps) {
  const problemRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);

  const handleSelectionEnd = (source: "problem" | "solution") => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const selected = selection.toString().trim();
    if (selected.length > 0) {
      onHighlight(selected);
      selection.removeAllRanges();
    }
  };

  // Split raw text into segments based on which parts are highlighted.
  // Each segment is rendered via MathRenderer; highlighted ones get a <mark>.
  function renderText(text: string, source: "problem" | "solution") {
    const sourceHighlights = highlights.filter((h) => h.source === source);
    if (sourceHighlights.length === 0) {
      return <MathRenderer text={text} />;
    }

    type Seg = { text: string; hlIndex: number };
    const segs: Seg[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      type Match = { pos: number; len: number; idx: number };
      let next: Match | null = null;
      for (let i = 0; i < sourceHighlights.length; i++) {
        const pos = remaining.indexOf(sourceHighlights[i].text);
        if (pos !== -1 && (next === null || pos < next.pos)) {
          next = { pos, len: sourceHighlights[i].text.length, idx: i };
        }
      }
      if (next === null) {
        segs.push({ text: remaining, hlIndex: -1 });
        break;
      }
      if (next.pos > 0) {
        segs.push({ text: remaining.slice(0, next.pos), hlIndex: -1 });
      }
      segs.push({
        text: remaining.slice(next.pos, next.pos + next.len),
        hlIndex: next.idx,
      });
      remaining = remaining.slice(next.pos + next.len);
    }

    return (
      <>
        {segs.map((seg, i) =>
          seg.hlIndex >= 0 ? (
            <mark
              key={i}
              onClick={() => onHighlightClick(seg.hlIndex)}
              className="cursor-pointer rounded bg-yellow-200 px-0.5 hover:bg-yellow-300"
              title="クリックでハイライト解除"
            >
              <MathRenderer text={seg.text} />
            </mark>
          ) : (
            <MathRenderer key={i} text={seg.text} />
          )
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-blue-800">問題文</h3>
        <div
          ref={problemRef}
          onMouseUp={() => handleSelectionEnd("problem")}
          onTouchEnd={() => handleSelectionEnd("problem")}
          className="select-text text-sm leading-loose text-gray-800"
        >
          {renderText(problemText, "problem")}
        </div>
      </div>

      {solutionText && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-blue-800">解説</h3>
          <div
            ref={solutionRef}
            onMouseUp={() => handleSelectionEnd("solution")}
            onTouchEnd={() => handleSelectionEnd("solution")}
            className="select-text text-sm leading-loose text-gray-800"
          >
            {renderText(solutionText, "solution")}
          </div>
        </div>
      )}

      {highlights.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          ハイライト部分をクリックすると解除できます
        </p>
      )}
    </div>
  );
}
