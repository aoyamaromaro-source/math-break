"use client";

import katex from "katex";

interface MathRendererProps {
  text: string;
  className?: string;
}

type Segment =
  | { type: "text"; value: string }
  | { type: "inline"; value: string }
  | { type: "block"; value: string };

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  // Match $$...$$ (block) before $...$ (inline) to avoid greedy collision
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

function toHtml(latex: string, displayMode: boolean): string {
  console.log("[MathRenderer] toHtml called:", { latex, displayMode });
  try {
    const html = katex.renderToString(latex, { throwOnError: false, displayMode });
    console.log("[MathRenderer] toHtml success, html length:", html.length);
    return html;
  } catch (e) {
    console.error("[MathRenderer] toHtml error:", e);
    return latex;
  }
}

export default function MathRenderer({ text, className }: MathRendererProps) {
  const segments = parseSegments(text);
  console.log("[MathRenderer] text:", JSON.stringify(text.slice(0, 120)));
  console.log("[MathRenderer] segments:", segments);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "block") {
          return (
            <span
              key={i}
              className="my-2 block overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: toHtml(seg.value, true) }}
            />
          );
        }
        if (seg.type === "inline") {
          return (
            <span
              key={i}
              className="inline-block align-middle"
              dangerouslySetInnerHTML={{ __html: toHtml(seg.value, false) }}
            />
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
