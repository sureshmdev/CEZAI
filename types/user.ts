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
