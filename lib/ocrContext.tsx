"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AppMode } from "@/types";

interface OcrData {
  problemText: string;
  solutionText: string;
  mode: AppMode;
}

interface OcrContextValue {
  ocrData: OcrData;
  setOcrData: (data: OcrData) => void;
  updateTexts: (problemText: string, solutionText: string) => void;
}

const defaultData: OcrData = {
  problemText: "",
  solutionText: "",
  mode: "problem-and-solution",
};

const OcrContext = createContext<OcrContextValue>({
  ocrData: defaultData,
  setOcrData: () => {},
  updateTexts: () => {},
});

export function OcrProvider({ children }: { children: ReactNode }) {
  const [ocrData, setOcrDataState] = useState<OcrData>(defaultData);

  const setOcrData = (data: OcrData) => setOcrDataState(data);
  const updateTexts = (problemText: string, solutionText: string) =>
    setOcrDataState((prev) => ({ ...prev, problemText, solutionText }));

  return (
    <OcrContext.Provider value={{ ocrData, setOcrData, updateTexts }}>
      {children}
    </OcrContext.Provider>
  );
}

export function useOcr() {
  return useContext(OcrContext);
}
