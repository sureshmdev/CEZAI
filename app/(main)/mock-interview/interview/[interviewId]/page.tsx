"use client";

import React, { useEffect, useState } from "react";
import { getMockInterviewById } from "@/actions/mock-interview";
import { Lightbulb, Video, VideoOff } from "lucide-react";
import Webcam from "react-webcam";
import { MockInterview } from "@prisma/client";
import { Button } from "@/components/ui/button";
import InterviewerTTS from "../../_components/interviewerTTS";
import Link from "next/link";

interface InterviewProps {
  params: Promise<{ interviewId: string }>;
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function Interview({ params }: InterviewProps) {
  const { interviewId } = React.use(params);

  const [interview, setInterview] = useState<MockInterview | null>(null);
  const [loading, setLoading] = useState(true);
  const [webCamEnabled, setWebCamEnabled] = useState(false);

  useEffect(() => {
    async function fetchInterview() {
      try {
        const data = await getMockInterviewById(interviewId);
        setInterview(data);
      } catch (err) {
        console.error("Failed to fetch interview:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchInterview();
  }, [interviewId]);

  if (loading) {
    return <div className="text-center mt-10">Loading interview...</div>;
  }

  if (!interview) {
    return (
      <div className="text-center mt-10 text-gray-500">No interview found.</div>
    );
  }

  const questions = interview.mockResponse as string[];

  return (
    <div className="my-10">
      <h2 className="font-bold text-2xl gradient-title">
        Let&apos;s Get Started
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex flex-col my-5 gap-5">
          <div className="flex flex-col p-5 rounded-lg border gap-5">
            <h2 className="text-lg">
              <strong>Job Role / Position: </strong>
              {toTitleCase(interview.position)}
            </h2>
            <h2 className="text-lg">
              <strong>Job Description / Tech-Stack: </strong>
              {toTitleCase(interview.description)}
            </h2>
            <h2 className="text-lg">
              <strong>Years of Experience: </strong>
              {interview.experience}
            </h2>
            <h2 className="text-lg">
              <strong>Type of Interview: </strong>
              {toTitleCase(interview.type)}
            </h2>
          </div>
          <div className="p-5 border border-yellow-300 rounded-lg">
            <h2 className="flex gap-2 items-center text-yellow-500">
              <Lightbulb />
              <strong>Information</strong>
            </h2>
            <h2 className="mt-3 text-yellow-500">
              Enable Video Web Cam and Microphone to Start your AI Generated
              Mock Interview, It has 5 question which you can answer and at the
              last you will get the report on the basis of your answer. NOTE: We
              never record your video, Web cam access you can disable at any
              time if you want
            </h2>
          </div>
        </div>

        <div className="mb-6 my-5 justify-center items-center">
          {webCamEnabled ? (
            <Webcam
              onUserMedia={() => setWebCamEnabled(true)}
              onUserMediaError={() => setWebCamEnabled(false)}
              mirrored={true}
              className="rounded-lg h-300px flex w-300px border"
            />
          ) : (
            <div className="justify-center items-center">
              <VideoOff className="w-full h-72 p-20 bg-secondary rounded-lg border" />
            </div>
          )}
          <div className="justify-center flex items-center">
            <Button
              variant="outline"
              className="rounded my-4 p-2 w-100"
              onClick={() => setWebCamEnabled((prev) => !prev)}
            >
              {webCamEnabled ? <Video /> : <VideoOff />}
            </Button>
          </div>
        </div>
      </div>
      <div className="my-5 flex justify-center items-center">
        <Link href={`/mock-interview/interview/${interview.mockId}/start`}>
          <Button size="lg">Start Interview</Button>
        </Link>
      </div>
    </div>
  );
}
