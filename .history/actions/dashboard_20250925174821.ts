"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { UserInsight as UserInsightsType, SalaryRange } from "@types";
import type { Prisma } from "@prisma/client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateAIInsights = async (
  industry: string,
  skills: string[],
  experience: number | null
): Promise<UserInsightsType> => {
  const prompt = `
    Analyze the current state of the ${industry} industry and provide insights tailored to a professional with ${
    experience ?? "unknown"
  } years of experience and expertise in the following skills: ${
    (skills ?? []).length ? skills.join(", ") : "no specific skills"
  }.
    Return insights in ONLY the following JSON format without any additional notes or explanations:

    {
      "salaryRanges": [
        { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
      ],
      "growthRate": number,
      "demandLevel": "High" | "Medium" | "Low",
      "topSkills": ["skill1", "skill2"],
      "marketOutlook": "Positive" | "Neutral" | "Negative",
      "keyTrends": ["trend1", "trend2"],
      "recommendedSkills": ["skill1", "skill2"]
    }

    IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
    Include at least 5 common roles for salary ranges.
    Growth rate should be a percentage.
    Include at least 5 skills and trends.
    Tailor all insights based on the user's skills and experience.
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

  return JSON.parse(cleanedText) as UserInsightsType;
};

export async function getUserInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { userInsight: true },
  });

  if (!user) throw new Error("User not found");

  if (!user.userInsight) {
    const insights = await generateAIInsights(
      user.industry ?? "",
      user.skills ?? [],
      user.experience ?? 0
    );

    const userInsight = await db.userInsight.create({
      data: {
        userId: user.id,
        industry: user.industry ?? "",
        salaryRanges: insights.salaryRanges as unknown as Prisma.JsonValue,
        growthRate: insights.growthRate,
        demandLevel: insights.demandLevel,
        topSkills: insights.topSkills as unknown as Prisma.JsonValue,
        marketOutlook: insights.marketOutlook,
        keyTrends: insights.keyTrends as unknown as Prisma.JsonValue,
        recommendedSkills:
          insights.recommendedSkills as unknown as Prisma.JsonValue,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return userInsight;
  }

  // Convert JSON fields to typed values
  return {
    ...user.userInsight,
    salaryRanges: user.userInsight.salaryRanges as unknown as SalaryRange[],
    topSkills: user.userInsight.topSkills as unknown as string[],
    keyTrends: user.userInsight.keyTrends as unknown as string[],
    recommendedSkills: user.userInsight
      .recommendedSkills as unknown as string[],
  };
}
