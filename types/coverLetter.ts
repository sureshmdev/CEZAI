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
