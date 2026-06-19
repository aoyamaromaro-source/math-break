export type AppMode = "problem-only" | "problem-and-solution";

export interface OCRResult {
  problemText: string;
  solutionText: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ExplainRequest {
  problemText: string;
  solutionText: string;
  highlightedText: string;
  userQuestion?: string;
  history: Message[];
}
