// Interview Input Types
export interface GenerateInterviewQuestionsInput {
  position: string;
  description: string;
  experience: number; // Changed to number for years
  type: InterviewType;
}

// Interview Type Enum
export type InterviewType =
  | "technical"
  | "behavioral"
  | "system-design"
  | "case-study"
  | "coding"
  | "general";

// Mock Interview Response
export interface MockInterviewResponse {
  id: string;
  userId: string;
  mockId: string;
  mockResponse: string[]; // Array of questions
  position: string;
  description: string;
  experience: number; // Changed to number
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

// For creating mock interviews
export interface CreateMockInterviewInput {
  position: string;
  description: string;
  experience: number;
  type: InterviewType;
}

// Question generation response from AI
export interface AIQuestionResponse {
  questions: string[];
}
