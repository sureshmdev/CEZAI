"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Up, GenerateCoverLetterInput, CoverLetter } from "@types";

// Ensure env var exists
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateCoverLetter(
  data: GenerateCoverLetterInput
): Promise<CoverLetter> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    Write a professional cover letter for a ${data.jobTitle} position at ${
    data.companyName
  }.
    
    About the candidate:
    - Industry: ${user.industry}
    - Years of Experience: ${user.experience}
    - Skills: ${user.skills?.join(", ")}
    - Professional Background: ${user.bio}
    
    Job Description:
    ${data.jobDescription ?? ""}
    
    Requirements:
    1. Use a professional, enthusiastic tone
    2. Highlight relevant skills and experience
    3. Show understanding of the company's needs
    4. Keep it concise (max 400 words)
    5. Use proper business letter formatting in markdown
    6. Include specific examples of achievements
    7. Relate candidate's background to job requirements
    
    Format the letter in markdown.
  `;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        jobDescription: data.jobDescription ?? null,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        status: "completed",
        userId: user.id,
      },
    });

    return coverLetter as CoverLetter;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error generating cover letter:", error.message);
    } else {
      console.error("Unknown error generating cover letter:", error);
    }
    throw new Error("Failed to generate cover letter");
  }
}

export async function getCoverLetters(): Promise<CoverLetter[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return db.coverLetter.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  }) as Promise<CoverLetter[]>;
}

export async function getCoverLetter(id: string): Promise<CoverLetter | null> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return db.coverLetter.findUnique({
    where: { id, userId: user.id },
  }) as Promise<CoverLetter | null>;
}

export async function updateCoverLetter(
  data: UpdateCoverLetterInput
): Promise<CoverLetter> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return db.coverLetter.update({
    where: {
      id: data.id,
      userId: user.id,
    },
    data: {
      content: data.content,
      status: "completed",
    },
  }) as Promise<CoverLetter>;
}

export async function deleteCoverLetter(id: string): Promise<CoverLetter> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return db.coverLetter.delete({
    where: { id, userId: user.id },
  }) as Promise<CoverLetter>;
}
