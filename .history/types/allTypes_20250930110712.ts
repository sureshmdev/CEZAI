// types/assessment.ts

export interface QuizQuestionInput {
  question: string;
  options: string[]; // Always 4 options
  correctAnswer: string;
  explanation: string;
}

export interface QuizResultInput {
  question: string;
  answer: string; // The correct answer
  userAnswer: string; // What the user picked
  isCorrect: boolean;
  explanation: string;
}

export interface QuizResponse {
  questions: QuizQuestionInput[];
}

export interface SaveQuizInput {
  questions: QuizQuestionInput[];
  answers: string[];
  score: number;
}

// Assessment Model Mirror (Prisma replacement for UI)
export interface Assessment {
  id: string;
  userId: string;
  quizScore: number;
  questions: QuizResultInput[]; // JSON field
  category: string; // e.g. "Technical"
  improvementTip?: string | null;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

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

// coverLetter.ts
export interface CoverLetter {
  id: string;
  userId: string;
  content: string;
  jobDescription: string | null;
  companyName: string;
  jobTitle: string;
  status: "draft" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateCoverLetterInput {
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
}

export interface UpdateCoverLetterInput {
  id: string;
  content: string;
}

export type CoverLetterRecord = CoverLetter;