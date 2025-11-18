"use client";

import { Lightbulb } from "lucide-react";
import React from "react";

interface QuestionsSectionProps {
  mockInterviewQuestion: string[];
  activeQuestionIndex: number;
  feedbackResult: string;
  setActiveQuestionIndex: (index: number) => void;
}

function QuestionsSection({
  mockInterviewQuestion,
  activeQuestionIndex,
  setActiveQuestionIndex,
}: QuestionsSectionProps) {
  return (
    mockInterviewQuestion && (
      <div className="p-5 border rounded-lg flex flex-col h-full">
        {/* Question Number Pills */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {mockInterviewQuestion.map((question, index) => (
            <h2
              key={index}
              onClick={() => setActiveQuestionIndex(index)}
              className={`p-2 bg-secondary rounded-full text-xs md:text-sm text-center cursor-pointer transition-colors duration-200 ${
                activeQuestionIndex === index && "bg-primary text-white"
              }`}
            >
              Question #{index + 1}
            </h2>
          ))}
        </div>

        {/* Current Question Display */}
        <div className="mb-5">
          <h2 className="text-lg md:text-xl font-medium">
            {mockInterviewQuestion[activeQuestionIndex]}
          </h2>
        </div>

        {/* Note Section */}
        <div className="mt-20 border rounded-lg p-5 bg-blue-100">
          <h2 className="flex gap-2 items-center text-blue-800">
            <Lightbulb className="w-5 h-5" />
            <strong>Note:</strong>
          </h2>
          <h2 className="text-sm text-blue-700 my-2">
            Enable Video Web Cam and Microphone to Start your AI Generated Mock
            Interview. It has {mockInterviewQuestion.length} questions which you
            can answer and at the end you will get a report based on your
            answers. NOTE: We never record your video. Webcam access can be
            disabled at any time if you want.
          </h2>
        </div>
      </div>
    )
  );
}

export default QuestionsSection;
