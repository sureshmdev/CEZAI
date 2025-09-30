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
