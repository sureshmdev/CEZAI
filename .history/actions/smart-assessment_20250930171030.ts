"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Assessment, Prisma } from "@prisma/client";
import type { QuizQuestionInput, QuizResultInput } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateQuiz(): Promise<QuizQuestionInput[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { industry: true, skills: true },
  });
  if (!user) throw new Error("User not found");

  const prompt = `
    Generate 10 technical interview questions for a ${
      user.industry
    } professional${
    user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
  }.
    Each question should be multiple choice with 4 options.
    Return the response in this JSON format only:
    { "questions": [ { "question": "string", "options": ["string","string","string","string"], "correctAnswer": "string", "explanation": "string" } ] }
  `;

  const result = await model.generateContent(prompt);
  const cleanedText = result.response
    .text()
    .replace(/```(?:json)?\n?/g, "")
    .trim();
  const quiz = JSON.parse(cleanedText) as { questions: QuizQuestionInput[] };
  return quiz.questions;
}

export async function saveQuizResult(
  questions: QuizQuestionInput[],
  answers: string[],
  score: number
): Promise<Assessment> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const questionResults: QuizResultInput[] = questions.map((q, idx) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[idx],
    isCorrect: q.correctAnswer === answers[idx],
    explanation: q.explanation,
  }));

  // Generate improvement tip for wrong answers
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);
  let improvementTip: string | null = null;
  if (wrongAnswers.length > 0) {
    const wrongText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
      The user got the following ${user.industry} questions wrong:
      ${wrongText}
      Provide a concise, specific improvement tip under 2 sentences.
    `;
    try {
      const tipResult = await model.generateContent(improvementPrompt);
      improvementTip = tipResult.response.text().trim();
    } catch (e) {
      console.error("Error generating improvement tip:", e);
    }
  }

  return db.assessment.create({
    data: {
      userId: user.id,
      quizScore: score,
      // 👇 ensure valid Prisma JsonValue
      questions: questionResults.map((q) => ({
        question: q.question,
        answer: q.answer,
        userAnswer: q.userAnswer,
        isCorrect: q.isCorrect,
        explanation: q.explanation,
      })) as Prisma.InputJsonValue,
      category: "Technical",
      improvementTip,
    },
  });
}

export async function getAssessments(): Promise<Assessment[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  return db.assessment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
}
