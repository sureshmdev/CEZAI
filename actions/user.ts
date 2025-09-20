"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface UpdateUserData {
  industry: string;
  experience?: string;
  bio?: string;
  skills?: string[];
}

interface SalaryRange {
  role: string;
  min: number;
  max: number;
  median: number;
  location: string;
}

export async function updateUser(data: UpdateUserData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // 1. Fetch Clerk user details
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("User not authenticated");

  const email = clerkUser.emailAddresses[0]?.emailAddress || "";
  const name = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ");

  // 2. Check if industry exists first
  let industryInsight = await db.industryInsight.findUnique({
    where: { industry: data.industry },
  });

  let salaryRangesForDb: Prisma.InputJsonValue[] = [];

  if (!industryInsight) {
    // Generate AI insights outside the transaction
    const insights = await generateAIInsights(data.industry);

    salaryRangesForDb = (insights.salaryRanges as SalaryRange[]).map((r) => ({
      role: r.role,
      min: r.min,
      max: r.max,
      median: r.median,
      location: r.location,
    }));

    industryInsight = { ...insights, industry: data.industry } as undefined; // placeholder for transaction
  }

  try {
    // 3. Perform transaction for DB writes only
    const result = await db.$transaction(async (tx) => {
      // Create industry if missing
      if (
        !(await tx.industryInsight.findUnique({
          where: { industry: data.industry },
        }))
      ) {
        await tx.industryInsight.create({
          data: {
            industry: data.industry,
            ...industryInsight,
            salaryRanges: salaryRangesForDb,
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // Upsert user
      const updatedUser = await tx.user.upsert({
        where: { clerkUserId: userId },
        update: {
          industry: data.industry,
          experience: data.experience,
          bio: data.bio,
          skills: data.skills || [],
          name,
          email,
        },
        create: {
          clerkUserId: userId,
          industry: data.industry,
          experience: data.experience,
          bio: data.bio,
          skills: data.skills || [],
          name,
          email,
        },
      });

      return updatedUser;
    });

    revalidatePath("/");
    return result;
  } catch (error: unknown) {
    console.error("Error updating user and industry:", error);
    if (error instanceof Error)
      throw new Error(`Failed to update profile: ${error.message}`);
    throw new Error("Failed to update profile: Unknown error");
  }
}

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { industry: true },
    });

    return { isOnboarded: !!user?.industry };
  } catch (error: unknown) {
    console.error("Error checking onboarding status:", error);
    if (error instanceof Error)
      throw new Error(`Failed to check onboarding status: ${error.message}`);
    throw new Error("Failed to check onboarding status: Unknown error");
  }
}
