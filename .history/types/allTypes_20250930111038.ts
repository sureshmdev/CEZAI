// allTypes

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

// index.ts
export * from "./common";
export * from "./user";
export * from "./userInsight";
export * from "./assessment";
export * from "./resume";
export * from "./coverLetter";
export * from "./industryInsight";
export * from "./interviewPrep";
export * from "./onboarding";

// industryInsights.ts
import { DemandLevel, MarketOutlook, SalaryRange } from "./common";
import { User } from "./user";

export interface IndustryInsight {
  id: string;
  industry: string;

  salaryRanges: SalaryRange[];
  growthRate: number;
  demandLevel: DemandLevel;
  topSkills: string[];
  marketOutlook: MarketOutlook;
  keyTrends: string[];
  recommendedSkills: string[];

  lastUpdated: Date;
  nextUpdate: Date;

  users: User[];
}

// interviewPrep.ts
export interface Feedback {
  id: string;
  interviewId: string;
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}

export interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
}

export interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}

export interface InterviewCardProps {
  interviewId?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
}

export interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
}

export interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

export interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

export interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

export interface SignInParams {
  email: string;
  idToken: string;
}

export interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
}

type FormType = "sign-in" | "sign-up";

export interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

export interface TechIconProps {
  techStack: string[];
}

// onboarding.ts

export interface SubIndustry {
  id: string;
  name: string;
}

export interface Industry {
  id: string;
  name: string;
  subIndustries: string[];
}

export interface OnboardingFormValues {
  industry: string;
  subIndustry: string;
  experience: number;
  skills: string;
  bio: string;
}

export interface OnboardingFormProps {
  industries: Industry[];
}

// resume.ts
export interface Resume {
  id: string;
  userId: string;
  content: string;
  atsScore?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

// user.ts
import { Assessment } from "./assessment";
import { Resume } from "./resume";
import { CoverLetter } from "./coverLetter";
import { UserInsight } from "./userInsight";
import { IndustryInsight } from "./industryInsight";
import type { User as PrismaUser } from "@prisma/client";

// Raw Prisma model
export type UserRecord = PrismaUser;

// Prisma model extended with relations
export interface User extends UserRecord {
  assessments: Assessment[];
  resume?: Resume;
  coverLetters: CoverLetter[]; // plural makes sense here
  userInsight?: UserInsight;
  industryInsight?: IndustryInsight;
}

export interface UpdateUserData {
  industry: string;
  experience: number;
  bio: string;
  skills: string[];
}

// userInsight.ts
import { DemandLevel, MarketOutlook, SalaryRange } from "./common";

export interface UserInsight {
  id: string;
  userId: string;
  industry: string;

  salaryRanges: SalaryRange[];
  growthRate: number;
  demandLevel: DemandLevel;
  topSkills: string[];
  marketOutlook: MarketOutlook;
  keyTrends: string[];
  recommendedSkills: string[];

  lastUpdated: Date;
  nextUpdate: Date;
}

enum MessageTypeEnum {
  TRANSCRIPT = "transcript",
  FUNCTION_CALL = "function-call",
  FUNCTION_CALL_RESULT = "function-call-result",
  ADD_MESSAGE = "add-message",
}

enum MessageRoleEnum {
  USER = "user",
  SYSTEM = "system",
  ASSISTANT = "assistant",
}

enum TranscriptMessageTypeEnum {
  PARTIAL = "partial",
  FINAL = "final",
}

interface BaseMessage {
  type: MessageTypeEnum;
}

interface TranscriptMessage extends BaseMessage {
  type: MessageTypeEnum.TRANSCRIPT;
  role: MessageRoleEnum;
  transcriptType: TranscriptMessageTypeEnum;
  transcript: string;
}

interface FunctionCallMessage extends BaseMessage {
  type: MessageTypeEnum.FUNCTION_CALL;
  functionCall: {
    name: string;
    parameters: unknown;
  };
}

interface FunctionCallResultMessage extends BaseMessage {
  type: MessageTypeEnum.FUNCTION_CALL_RESULT;
  functionCallResult: {
    forwardToClientEnabled?: boolean;
    result: unknown;
    [a: string]: unknown;
  };
}

type Message =
  | TranscriptMessage
  | FunctionCallMessage
  | FunctionCallResultMessage;
