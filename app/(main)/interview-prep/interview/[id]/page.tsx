import Image from "next/image";
import { redirect } from "next/navigation";

import Agent from "../_components/Agent";
import { getRandomInterviewCover } from "@/lib/utils";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/actions/interview-prep";
import DisplayTechIcons from "../_components/DisplayTechIcons";
import { RouteParams } from "@/types";
import { auth } from "@clerk/nextjs/server";

const InterviewDetails = async ({ params }: RouteParams) => {
  const { id } = await params;

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/");

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: clerkUserId,
  });

  return (
    <>
      <div className="flex flex-row gap-4 justify-between">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center">
            <Image
              src={getRandomInterviewCover()}
              alt="cover-image"
              width={40}
              height={40}
              className="rounded-full object-cover size-[40px]"
            />
            <h3 className="capitalize">{interview.role} Interview</h3>
          </div>

          <DisplayTechIcons techStack={interview.techstack} />
        </div>

        <p className="bg-dark-200 px-4 py-2 rounded-lg h-fit">
          {interview.type}
        </p>
      </div>

      <Agent
        userName={feedback?.userId ?? clerkUserId}
        userId={clerkUserId}
        interviewId={id}
        type="interview"
        questions={interview.questions}
        feedbackId={feedback?.id}
      />
    </>
  );
};

export default InterviewDetails;
