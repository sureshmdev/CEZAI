"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { MockInterview } from "@prisma/client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export interface GenerateInterviewQuestionsInput {
  position: string;
  description: string;
  experience: number;
  type: string;
}

export async function generateInterviewQuestions(
  input: GenerateInterviewQuestionsInput
): Promise<string[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { position, description, experience, type } = input;

  const prompt = `
    You are an expert technical interviewer. Generate 5 high-quality interview questions for the following job role.
    
    Job Role: ${position}
    Tech Stack/Description: ${description}
    Experience Level: ${experience} years
    Interview Focus: ${type}
    
    IMPORTANT CONSTRAINTS:
    - Generate exactly 5 questions
    - Questions should be appropriate for ${experience} years of experience
    - Focus primarily on ${type} interview style
    - Do NOT use special characters like /, *, #, @, or any markdown formatting
    - Questions will be read by a voice assistant, so use only plain text
    - Make questions clear, concise, and conversational
    - Return ONLY valid JSON.
    - The JSON must have the exact format as given :
      "{"questions": ["question 1", "question 2", "question 3", "question 4", "question 5"]}"
    - Do not wrap in code blocks.
    - Do not explain.
  `;

  const result = await model.generateContent(prompt);
  const cleanedText = result.response
    .text()
    .replace(/```(?:json)?\n?/g, "")
    .trim();

  const response = JSON.parse(cleanedText) as { questions: string[] };
  return response.questions;
}

export async function createMockInterview(
  input: GenerateInterviewQuestionsInput
): Promise<MockInterview> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  // Generate questions
  const questions = await generateInterviewQuestions(input);

  // Generate unique mockId
  const mockId = `mock_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  // Create mock interview record
  return db.mockInterview.create({
    data: {
      userId: user.id,
      mockId,
      mockResponse: questions,
      position: input.position,
      description: input.description,
      experience: input.experience,
      type: input.type,
    },
  });
}

export async function getMockInterviews(): Promise<MockInterview[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  return db.mockInterview.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMockInterviewById(
  mockId: string
): Promise<MockInterview | null> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  return db.mockInterview.findFirst({
    where: {
      mockId,
      userId: user.id,
    },
  });
}

export async function deleteMockInterview(mockId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const mockInterview = await db.mockInterview.findFirst({
    where: {
      mockId,
      userId: user.id,
    },
  });

  if (!mockInterview) throw new Error("Mock interview not found");

  await db.mockInterview.delete({
    where: { id: mockInterview.id },
  });
}

export async function getFeedback(userAnswers: object): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const formattedTranscript = JSON.stringify(userAnswers);
  const prompt = `
    You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. 
    Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
    
    Transcript:
    ${formattedTranscript}

    Please score the candidate from 0 to 100 in the following areas. 
    Do not add categories other than the ones provided:
    - Communication Skills
    - Technical Knowledge
    - Problem-Solving
    - Cultural & Role Fit
    - Confidence & Clarity
    Structure the answer in html tag format such that the raw HTML can be directly injected into a webpage. Give it proper and professional looking CSS styling.
    Background should be dark and text should be white
    This returned HTML will be set inside a <p> tag so do not give global styling or attempt to modify the layout of any components outside it such as body, or other HTML tags. Restrict to inline CSS styling.
  `;
  const result = await model.generateContent(prompt);
  return result.response.text();
}
