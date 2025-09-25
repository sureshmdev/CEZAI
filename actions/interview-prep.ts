"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { PrismaClient, Feedback, Interview } from "@prisma/client";
import { feedbackSchema } from "@/constants";
import {
  CreateFeedbackParams,
  GetFeedbackByInterviewIdParams,
  GetLatestInterviewsParams,
} from "@/types";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, transcript, feedbackId } = params;
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  });
  if (!user) throw new Error("User not found");

  const formattedTranscript = transcript
    .map(
      (sentence: { role: string; content: string }) =>
        `- ${sentence.role}: ${sentence.content}\n`
    )
    .join("");

  const { object } = await generateObject({
    model: google("gemini-2.0-flash-001"),
    schema: feedbackSchema,
    prompt: `
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
  `,
    system:
      "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
  });

  const feedbackData = {
    interviewId,
    userId: user.id,
    totalScore: object.totalScore,
    categoryScores: object.categoryScores,
    strengths: object.strengths,
    areasForImprovement: object.areasForImprovement,
    finalAssessment: object.finalAssessment,
    transcript,
    createdAt: new Date(),
  };

  const savedFeedback: Feedback = feedbackId
    ? await prisma.feedback.update({
        where: { id: feedbackId, userId: user.id },
        data: feedbackData,
      })
    : await prisma.feedback.create({
        data: feedbackData,
      });

  return { success: true, feedbackId: savedFeedback.id };
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  return prisma.interview.findUnique({
    where: { id },
  });
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId } = params;
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  });
  if (!user) throw new Error("User not found");

  return prisma.feedback.findFirst({
    where: { interviewId, userId: user.id },
  });
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { limit = 20 } = params;
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  });
  if (!user) throw new Error("User not found");

  return prisma.interview.findMany({
    where: {
      finalized: true,
      NOT: { userId: user.id },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getInterviewsByUserId(requestedUserId: string) {
  const { userId } = await auth();
  if (!userId || userId !== requestedUserId) throw new Error("Unauthorized");

  return prisma.interview.findMany({
    where: { userId: requestedUserId },
    orderBy: { createdAt: "desc" },
  });
}
