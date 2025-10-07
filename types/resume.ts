// resume.ts

// ----------------------------
// Prisma Resume Type
// ----------------------------
export interface Resume {
  id: string;
  userId: string;
  content: string;
  atsScore?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------------
// User + Resume for queries
// ----------------------------
export interface ResumeWithUser extends Resume {
  user: {
    id: string;
    clerkUserId: string;
    name?: string;
    email: string;
    industry?: string;
    industryInsight?: IndustryInsight;
  };
}

// ----------------------------
// Industry Insight Type
// ----------------------------
export interface IndustryInsight {
  salaryRanges: Array<{
    role: string;
    min: number;
    max: number;
    median: number;
    location?: string;
  }>;
  growthRate: number;
  demandLevel: string; // "High" | "Medium" | "Low"
  topSkills: string[];
  marketOutlook: string; // "Positive" | "Neutral" | "Negative"
  keyTrends: string[];
  recommendedSkills: string[];
  lastUpdated: Date;
  nextUpdate: Date;
}

// ----------------------------
// Resume Form Types
// ----------------------------
export interface ContactInfo {
  email?: string;
  mobile?: string;
  linkedin?: string;
  twitter?: string;
}

export interface Entry {
  title: string;
  organization?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  current?: boolean;
}

// Used specifically for markdown rendering
export interface MarkdownEntry extends Entry {
  description: string;
}

export interface ResumeFormValues {
  contactInfo: ContactInfo;
  summary: string;
  skills: string;
  experience: Entry[];
  education: Entry[];
  projects: Entry[];
}

// ----------------------------
// AI Improvement Types
// ----------------------------
export interface ImproveWithAIParams {
  current: string;
  type: string; // "Experience", "Education", "Project", etc.
}

export type ImproveWithAIResponse = string;

// ----------------------------
// Generic Fetch Hook Result Type
// ----------------------------
export type AsyncFn<TData, TArgs extends unknown[]> = (
  ...args: TArgs
) => Promise<TData>;

export interface UseFetchResult<TData, TArgs extends unknown[]> {
  data?: TData;
  loading: boolean;
  error: Error | null;
  fn: AsyncFn<TData, TArgs>;
  setData: (data: TData | undefined) => void;
}
