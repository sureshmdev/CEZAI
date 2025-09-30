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
