"use server";
import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";
import { Prisma } from "@prisma/client";
import type { UpdateUserData, SalaryRange } from "@types";

export async function updateUser(data: UpdateUserData) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  try {
    // Get user details from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("User not found in Clerk");

    // First, upsert the user (create if doesn't exist, update if exists)
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
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: clerkUser.fullName || clerkUser.username || "",
        skills: data.skills || [],
        industry: data.industry,
        experience: data.experience,
        bio: data.bio,
      },
    });

    // Generate AI insights
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

    // Now create/update the user insights
    await db.userInsight.upsert({
      where: { userId: updatedUser.id },
      create: {
        userId: updatedUser.id,
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
