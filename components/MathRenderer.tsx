"use client";

import { InlineMath, BlockMath } from "react-katex";

interface MathRendererProps {
  text: string;
  className?: string;
}

// Split text into plain / inline-math / block-math segments
type Segment =
  | { type: "text"; value: string }
  | { type: "inline"; value: string }
  | { type: "block"; value: string };

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  // Match $$...$$ first (block), then $...$ (inline)
  const pattern = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: "text", value: text.slice(last, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith("$$")) {
      segments.push({ type: "block", value: raw.slice(2, -2).trim() });
    } else {
      segments.push({ type: "inline", value: raw.slice(1, -1).trim() });
    }
    last = match.index + raw.length;
  }

  if (last < text.length) {
    segments.push({ type: "text", value: text.slice(last) });
  }

  return segments;
}

export default function MathRenderer({ text, className }: MathRendererProps) {
  const segments = parseSegments(text);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "block") {
          return (
            <span key={i} className="my-2 block overflow-x-auto">
              <BlockMath math={seg.value} />
            </span>
          );
        }
        if (seg.type === "inline") {
          return (
            <span key={i} className="inline-block align-middle">
              <InlineMath math={seg.value} />
            </span>
          );
        }
        // plain text — preserve whitespace/newlines
        return (
          <span key={i} className="whitespace-pre-wrap">
            {seg.value}
          </span>
        );
      })}
    </span>
  );
}
