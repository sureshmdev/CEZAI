import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import InterviewCard from "./interview/_components/InterviewCard";

import { auth } from "@clerk/nextjs/server";
import {
  getInterviewsByUserId,
  getLatestInterviews,
} from "@/actions/interview-prep";

const InterviewPrepPage = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  let [userInterviews, allInterview] = await Promise.all([
    getInterviewsByUserId(userId),
    getLatestInterviews({ userId }),
  ]);

  userInterviews = userInterviews ?? [];
  allInterview = allInterview ?? [];

  const hasPastInterviews = userInterviews.length > 0;
  const hasUpcomingInterviews = allInterview.length > 0;

  return (
    <div className="flex flex-col gap-12">
      {/* Hero Section */}
      <Card className=" p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-lg">
          <h2 className="text-3xl font-bold">
            Get Interview-Ready with AI-Powered Practice & Feedback
          </h2>
          <p className="text-lg">
            Practice real interview questions & get instant feedback
          </p>

          <Button asChild className="w-fit px-6 py-3">
            <Link href="/interview-prep/interview">Start an Interview</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="hidden md:block"
        />
      </Card>

      {/* Past Interviews */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold">Your Interviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasPastInterviews ? (
            userInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={userId}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt.toString()}
              />
            ))
          ) : (
            <Card className="p-6 text-center text-[var(--muted-foreground)]">
              <CardContent>
                You haven&apos;t taken any interviews yet
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Upcoming Interviews */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold">Take Interviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasUpcomingInterviews ? (
            allInterview.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={userId}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt.toString()}
              />
            ))
          ) : (
            <Card className="p-6 text-center text-[var(--muted-foreground)]">
              <CardContent>There are no interviews available</CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};

export default InterviewPrepPage;
