"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { MockInterview } from "@prisma/client";
import { revalidatePath } from "next/cache";

console.log("🔥 BACKEND LOADED");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export interface GenerateInterviewQuestionsInput {
  position: string;
  description: string;
  experience: number;
  type: string;
}

export interface FeedbackScore {
  category: string;
  score: number;
  maxScore: number;
  feedback: string;
  improvements: string[];
}

export interface InterviewFeedback {
  overallScore: number;
  overallGrade: string;
  categories: FeedbackScore[];
  strengths: string[];
  criticalWeaknesses: string[];
  detailedAnalysis: string;
  industryBenchmark: string;
  actionableSteps: string[];
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
  const interview = await db.mockInterview.create({
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

  // Revalidate the mock interview page to show the new interview
  revalidatePath("/mock-interview");

  return interview;
}

// GET ALL USER'S MOCK INTERVIEWS
export async function getUserInterviews(): Promise<MockInterview[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const interviews = await db.mockInterview.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return interviews;
}

// GET MOCK INTERVIEWS (ALIAS - for backwards compatibility)
export async function getMockInterviews(): Promise<MockInterview[]> {
  return getUserInterviews();
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

// DELETE MOCK INTERVIEW BY MOCK ID
export async function deleteMockInterview(mockId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

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

  // Revalidate the page to update the UI
  revalidatePath("/mock-interview");
}

// DELETE MOCK INTERVIEW BY DATABASE ID (Alternative method)
export async function deleteMockInterviewById(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  // Verify ownership before deleting
  const mockInterview = await db.mockInterview.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!mockInterview) {
    throw new Error(
      "Mock interview not found or you don't have permission to delete it"
    );
  }

  await db.mockInterview.delete({
    where: { id },
  });

  // Revalidate the page to update the UI
  revalidatePath("/mock-interview");
}

// UPDATE MOCK INTERVIEW WITH FEEDBACK
export async function saveMockInterviewFeedback(
  mockId: string,
  feedback: string
): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const mockInterview = await db.mockInterview.findFirst({
    where: {
      mockId,
      userId: user.id,
    },
  });

  if (!mockInterview) throw new Error("Mock interview not found");

  await db.mockInterview.update({
    where: { id: mockInterview.id },
    data: { feedback },
  });

  // Revalidate the page to update the UI
  revalidatePath("/mock-interview");
  revalidatePath(`/mock-interview/interview/${mockId}`);
}

// GENERATE FEEDBACK
export async function getFeedback(
  userAnswers: { questions: string[]; answers: string[] },
  mockId: string // Make this required, not optional
): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  // Find the mock interview
  const mockInterview = await db.mockInterview.findFirst({
    where: {
      mockId,
      userId: user.id,
    },
  });

  if (!mockInterview) throw new Error("Mock interview not found");

  const formattedTranscript = JSON.stringify(userAnswers, null, 2);

  const prompt = `
You are a senior technical interviewer and career coach with 15+ years of experience. Your role is to provide BRUTALLY HONEST, industry-standard feedback on this mock interview performance.

CRITICAL INSTRUCTIONS:
- Be HONEST and CRITICAL - do not sugarcoat or inflate scores
- Use REAL industry standards for scoring
- A score of 60-70 is AVERAGE, not good
- Scores below 50 indicate significant concerns
- Scores above 80 are reserved for truly exceptional answers
- Point out EVERY mistake, hesitation, lack of depth, or missing information
- Compare performance to what top companies (FAANG, Fortune 500) expect

Interview Transcript:
${formattedTranscript}

Analyze each answer thoroughly and provide scores based on these STRICT criteria:

**Scoring Categories (0-100 scale):**

1. **Technical Knowledge** (if applicable)
   - 90-100: Expert-level understanding, could teach others
   - 70-89: Solid understanding with minor gaps
   - 50-69: Basic understanding but lacks depth
   - 30-49: Significant knowledge gaps
   - 0-29: Fundamental misunderstandings

2. **Communication Clarity**
   - 90-100: Crystal clear, well-structured, concise
   - 70-89: Clear but could be more concise
   - 50-69: Somewhat unclear, rambling, or verbose
   - 30-49: Difficult to follow, poor structure
   - 0-29: Incomprehensible or incoherent

3. **Problem-Solving Approach**
   - 90-100: Systematic, considers edge cases, optimal solutions
   - 70-89: Logical but misses some considerations
   - 50-69: Basic approach but lacks depth
   - 30-49: Disorganized or incomplete
   - 0-29: No clear methodology

4. **Depth & Specificity**
   - 90-100: Detailed examples, specific metrics, deep insights
   - 70-89: Some specifics but could go deeper
   - 50-69: Surface-level, generic answers
   - 30-49: Vague, no concrete examples
   - 0-29: No substance or relevant details

5. **Cultural & Role Fit**
   - 90-100: Perfect alignment, shows deep understanding
   - 70-89: Good fit with minor concerns
   - 50-69: Adequate but not compelling
   - 30-49: Misalignment in values or expectations
   - 0-29: Poor fit for role or company

6. **Confidence & Professionalism**
   - 90-100: Poised, professional, authoritative
   - 70-89: Confident but occasional uncertainty
   - 50-69: Hesitant or overly casual
   - 30-49: Unprofessional or very uncertain
   - 0-29: Lacks basic professionalism

**STRICT EVALUATION RULES:**
- If an answer is incomplete or missing key points: deduct 20-30 points
- If an answer shows lack of preparation: 40-60 range maximum
- If an answer demonstrates poor communication: cap at 50
- Generic, textbook answers without personalization: 50-60 range
- Rambling or unfocused answers: deduct 15-25 points
- Missing concrete examples: deduct 20 points
- Incorrect information: automatic 30-40 range

**Industry Benchmark Context:**
- Entry-level (0-2 years): 55-65 is acceptable
- Mid-level (3-5 years): 65-75 is acceptable
- Senior (5-10 years): 75-85 expected
- Principal/Lead (10+ years): 85+ expected

Return ONLY valid JSON in this EXACT format:
{
  "overallScore": <number 0-100>,
  "overallGrade": "<letter grade A-F with +/->",
  "categories": [
    {
      "category": "Technical Knowledge",
      "score": <number 0-100>,
      "maxScore": 100,
      "feedback": "<honest, critical 2-3 sentence assessment>",
      "improvements": ["<specific action>", "<specific action>", "<specific action>"]
    },
    {
      "category": "Communication Clarity",
      "score": <number 0-100>,
      "maxScore": 100,
      "feedback": "<honest assessment>",
      "improvements": ["<specific action>", "<specific action>"]
    },
    {
      "category": "Problem-Solving Approach",
      "score": <number 0-100>,
      "maxScore": 100,
      "feedback": "<honest assessment>",
      "improvements": ["<specific action>", "<specific action>"]
    },
    {
      "category": "Depth & Specificity",
      "score": <number 0-100>,
      "maxScore": 100,
      "feedback": "<honest assessment>",
      "improvements": ["<specific action>", "<specific action>"]
    },
    {
      "category": "Cultural & Role Fit",
      "score": <number 0-100>,
      "maxScore": 100,
      "feedback": "<honest assessment>",
      "improvements": ["<specific action>"]
    },
    {
      "category": "Confidence & Professionalism",
      "score": <number 0-100>,
      "maxScore": 100,
      "feedback": "<honest assessment>",
      "improvements": ["<specific action>"]
    }
  ],
  "strengths": [
    "<specific strength observed>",
    "<specific strength observed>"
  ],
  "criticalWeaknesses": [
    "<specific weakness that must be addressed>",
    "<specific weakness that must be addressed>",
    "<specific weakness that must be addressed>"
  ],
  "detailedAnalysis": "<2-3 paragraph honest analysis of overall performance, comparing to industry standards. Be specific about what was good and what was lacking.>",
  "industryBenchmark": "<1 paragraph on how this performance compares to candidates at this experience level in the industry. Be honest about competitiveness.>",
  "actionableSteps": [
    "<specific, concrete action to take within next week>",
    "<specific, concrete action to take within next week>",
    "<specific, concrete action to take within next month>",
    "<specific study/practice recommendation>",
    "<specific resource or practice method>"
  ]
}

DO NOT:
- Wrap in code blocks
- Add any explanation outside the JSON
- Use markdown formatting
- Be overly positive or encouraging
- Inflate scores
- Give generic feedback

BE BRUTALLY HONEST. This person needs to know the truth to improve.
`;

  try {
    console.log("Generating feedback for mockId:", mockId);

    const result = await model.generateContent(prompt);
    const cleanedText = result.response
      .text()
      .replace(/```(?:json)?\n?/g, "")
      .trim();

    console.log("Feedback generated, saving to database...");

    // Save feedback to database
    await db.mockInterview.update({
      where: { id: mockInterview.id },
      data: {
        feedback: cleanedText,
        updatedAt: new Date(),
      },
    });

    console.log("Feedback saved successfully!");

    // Revalidate the pages
    revalidatePath("/mock-interview");
    revalidatePath(`/mock-interview/interview/${mockId}`);

    return cleanedText;
  } catch (error) {
    console.error("Error in getFeedback:", error);
    throw error;
  }
}
