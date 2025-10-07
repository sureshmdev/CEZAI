"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";
import { Prisma } from "@prisma/client";
import type { UpdateUserData, SalaryRange } from "@types";

export async function updateUser(data: UpdateUserData) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  try {
    const dbUser = await db.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });
    if (!dbUser) throw new Error("User not found in DB");

    const insights = await generateAIInsights(
      data.industry,
      data.skills,
      data.experience
    );

    const salaryRangesForDb: Prisma.InputJsonValue[] = (
      insights.salaryRanges as SalaryRange[]
    ).map((r) => ({
      role: r.role,
      min: r.min,
      max: r.max,
      median: r.median,
      location: r.location,
    }));

    await db.userInsight.upsert({
      where: { userId: dbUser.id },
      create: {
        userId: dbUser.id,
        industry: data.industry,
        ...insights,
        salaryRanges: salaryRangesForDb,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      update: {
        industry: data.industry,
        ...insights,
        salaryRanges: salaryRangesForDb,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const updatedUser = await db.user.upsert({
      where: { clerkUserId },
      update: {
        industry: data.industry,
        experience: data.experience,
        bio: data.bio,
        skills: data.skills,
      },
      create: {
        clerkUserId,
        email: "",
        name: "",
        skills: data.skills || [],
        industry: data.industry,
        experience: data.experience,
        bio: data.bio,
      },
    });

    revalidatePath("/");
    return updatedUser;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(
        "Error updating user and industry:",
        error.message,
        error.stack
      );
      throw new Error(`Failed to update profile: ${error.message}`);
    } else {
      console.error("Unknown error updating user and industry:", String(error));
      throw new Error("Failed to update profile: Unknown error");
    }
  }
}

export async function getUserOnboardingStatus(): Promise<{
  isOnboarded: boolean;
}> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { industry: true },
    });

    return {
      isOnboarded: Boolean(user?.industry && user.industry.trim() !== ""),
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(
        "Error checking onboarding status:",
        String(error.message),
        String(error.stack)
      );
      throw new Error(
        `Failed to check onboarding status: ${String(error.message)}`
      );
    } else {
      console.error("Unknown error checking onboarding status:", String(error));
      throw new Error("Failed to check onboarding status: Unknown error");
    }
  }
}
