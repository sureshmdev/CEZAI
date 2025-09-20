// common.ts -> Shared / Nested reusable types

export interface SalaryRange {
  role: string;
  min: number;
  max: number;
  median: number;
  location?: string;
}

export interface AssessmentQuestion {
  question: string;
  answer: string;
  userAnswer: string;
  isCorrect: boolean;
}

export type DemandLevel = "High" | "Medium" | "Low";
export type MarketOutlook = "Positive" | "Neutral" | "Negative";
