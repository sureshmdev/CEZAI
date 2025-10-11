"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { Resume } from "@types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

interface ImproveWithAIParams {
  current: string;
  type: string;
}

// Resume Save
export async function saveResume(content: string): Promise<Resume> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const resume = await db.resume.upsert({
      where: { userId: user.id },
      update: { content },
      create: { userId: user.id, content },
    });

    revalidatePath("/resume");
    return resume as Resume;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error saving resume:", error.message);
    } else {
      console.error("Unknown error saving resume:", error);
    }
    throw new Error("Failed to save resume");
  }
}

// Resume Get
export async function getResume(): Promise<Resume | null> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return (await db.resume.findUnique({
    where: { userId: user.id },
  })) as Resume | null;
}

// AI Improvement
export async function improveWithAI({
  current,
  type,
}: ImproveWithAIParams): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    As an expert resume writer, improve the following ${type} description for a ${user.industry} professional.
    Make it more impactful, quantifiable, and aligned with industry standards.
    Current content: "${current}"

    Requirements:
    1. Use action verbs
    2. Include metrics and results where possible
    3. Highlight relevant technical skills
    4. Keep it concise but detailed
    5. Focus on achievements over responsibilities
    6. Use industry-specific keywords
    
    Format the response as a single paragraph without any additional text or explanations.
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error improving content:", error.message);
    } else {
      console.error("Unknown error improving content:", error);
    }
    throw new Error("Failed to improve content");
  }
}
