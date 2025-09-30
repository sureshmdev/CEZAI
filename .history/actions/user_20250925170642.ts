"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";
import { Prisma } from "@prisma/client";
import type { UpdateUserData, SalaryRange } from "@types";

export async function updateUser(data: UpdateUserData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const insights = await generateAIInsights(
      data.industry,
      data.skills,
      data.experience,
    );

    // Convert SalaryRange[] into Prisma.InputJsonValue[]
    const salaryRangesForDb: Prisma.InputJsonValue[] = (
      insights.salaryRanges as SalaryRange[]
    ).map((r) => ({
      role: r.role,
      min: r.min,
      max: r.max,
      median: r.median,
      location: r.location,
    }));

    let industryInsight = await db.industryInsight.findUnique({
      where: {
        industry: data.industry,
      },
    });

    if (!industryInsight) {
      industryInsight = await db.industryInsight.create({
        data: {
          ...insights,
          industry: data.industry,
          salaryRanges: salaryRangesForDb,
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
        },
      });
    }

    const updatedUser = await db.user.upsert({
      where: {
        clerkUserId: userId,
      },
      update: {
        industry: data.industry,
        experience: data.experience,
        bio: data.bio,
        skills: data.skills,
      },
      create: {
        clerkUserId: userId,
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
      console.error("Unknown error updating user and industry:", error);
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
      where: {
        clerkUserId: userId,
      },
      select: {
        industry: true,
      },
    });

    return { isOnboarded: !!user?.industry };
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
