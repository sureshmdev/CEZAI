import { db } from "@/lib/prisma";
import { inngest } from "./client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserInsight, SalaryRange } from "@types";
import { Prisma } from "@prisma/client"; // For InputJsonValue

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateUserInsights = inngest.createFunction(
  {
    id: "generate-user-insights",
    name: "Generate User Insights",
  },
  { cron: "0 0 * * 0" }, // every Sunday at midnight
  async ({ event, step }) => {
    // Fetch all users with industry info
    const users = await step.run("Fetch users", async () => {
      return db.user.findMany({
        where: { industry: { not: null } },
        select: {
          id: true,
          industry: true,
          skills: true,
          experience: true,
        },
      });
    });

    for (const user of users) {
      const { id: userId, industry, skills, experience } = user;

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

      // Generate AI insights
      const res = await step.ai.wrap(
        "gemini",
        async ({ prompt }: { prompt: string }) => {
          const response = await model.generateContent(prompt);
          return response.response.text();
        },
        { prompt }
      );

      const cleanedText = res.replace(/```(?:json)?\n?/g, "").trim();

      // Parse AI response safely as UserInsight
      const insights: UserInsight = JSON.parse(cleanedText);

      // Map SalaryRange[] to Prisma.InputJsonValue[] (no nulls allowed)
      const salaryRangesJson: Prisma.InputJsonValue[] = (
        insights.salaryRanges ?? []
      ).map((s: SalaryRange) => ({
        role: s.role ?? "",
        min: s.min ?? 0,
        max: s.max ?? 0,
        median: s.median ?? 0,
        location: s.location ?? "",
      }));

      // Upsert UserInsight for this user
      await step.run(`Upsert insights for user ${userId}`, async () => {
        await db.userInsight.upsert({
          where: { userId },
          create: {
            userId,
            industry: industry!,
            salaryRanges: salaryRangesJson,
            growthRate: insights.growthRate,
            demandLevel: insights.demandLevel,
            topSkills: insights.topSkills,
            marketOutlook: insights.marketOutlook,
            keyTrends: insights.keyTrends,
            recommendedSkills: insights.recommendedSkills,
            lastUpdated: new Date(),
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          update: {
            salaryRanges: salaryRangesJson,
            growthRate: insights.growthRate,
            demandLevel: insights.demandLevel,
            topSkills: insights.topSkills,
            marketOutlook: insights.marketOutlook,
            keyTrends: insights.keyTrends,
            recommendedSkills: insights.recommendedSkills,
            lastUpdated: new Date(),
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      });
    }
  }
);
