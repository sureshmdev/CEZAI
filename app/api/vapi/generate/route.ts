import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { PrismaClient } from "@prisma/client";
import { getRandomInterviewCover } from "@/lib/utils";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { type, role, level, techstack, amount, userid } = await request.json();

  try {
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: `Prepare questions for a job interview.
        The job role is ${position}.
        The job description / tech stack used in the job is: ${description}.
        The job experience years is ${experience}.
        The focus of interview should lean towards the interview type of: ${type}.
        The amount of questions required is: 5
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
    `,
    });

    const interview = await prisma.interview.create({
      data: {
        role,
        type,
        level,
        techstack: techstack.split(",").map((s: string) => s.trim()),
        questions: JSON.parse(questions),
        userId: userid,
        finalized: true,
        coverImage: getRandomInterviewCover(),
        createdAt: new Date().toISOString(),
      },
    });

    return Response.json({ success: true, interview }, { status: 200 });
  } catch (error) {
    console.error("Error creating interview:", error);
    return Response.json(
      { success: false, error: `${error}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
