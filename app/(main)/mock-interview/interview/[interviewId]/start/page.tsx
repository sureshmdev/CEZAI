"use client";

import { getMockInterviewById } from "@/actions/mock-interview";
import { MockInterview } from "@prisma/client";
import React, { useEffect, useState } from "react";
import QuestionsSection from "./_components/questions-section";
import RecordAnswerSection from "./_components/record-answer-section";

interface StartInterviewProps {
  params: Promise<{ interviewId: string }>;
}

function StartInterview({ params }: StartInterviewProps) {
  const { interviewId } = React.use(params);

  const [interview, setInterview] = useState<MockInterview | null>(null);
  const [loading, setLoading] = useState(true);
  const [webCamEnabled, setWebCamEnabled] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [feedbackResult, setFeedbackResult] = useState("");
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
    return <div className="text-center mt-10">Starting interview...</div>;
  }

  if (!interview) {
    return (
      <div className="text-center mt-10 text-gray-500">No interview found.</div>
    );
  }

  const questions = interview.mockResponse as string[];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Questions */}
        <QuestionsSection
          mockInterviewQuestion={questions}
          feedbackResult={feedbackResult}
          activeQuestionIndex={activeQuestionIndex}
          setActiveQuestionIndex={setActiveQuestionIndex}
        />

        {/* Video / Audio Recording */}
        <RecordAnswerSection
          mockInterviewQuestion={questions}
          setFeedback={setFeedbackResult}
          setActiveQuestionIndex={setActiveQuestionIndex}
          activeQuestionIndex={activeQuestionIndex}
        />
      </div>
    </div>
  );
}

export default StartInterview;
