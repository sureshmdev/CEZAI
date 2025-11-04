"use client";

import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, ActivitySquare } from "lucide-react";
import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import useSpeechToText from "react-hook-speech-to-text";
import { getFeedback } from "@/actions/mock-interview";

interface RecordAnsSectionProps {
  mockInterviewQuestion: string[];
  activeQuestionIndex: number;
  setActiveQuestionIndex: (number) => void;
  setFeedback: (string) => void;
}

function RecordAnswerSection({
  mockInterviewQuestion,
  activeQuestionIndex,
  setActiveQuestionIndex,
  setFeedback,
}: RecordAnsSectionProps) {
  const [webCamEnabled, setWebCamEnabled] = useState(false);
  const [switchTranscript, setSwitchTranscript] = useState(0);

  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  const [speechKey, setSpeechKey] = useState(0);
  const [answers, setAnswers] = useState(
    Array.from(new Array(5)).map(() => "")
  );
  const [currentTranscript, setCurrentTranscript] = useState(
    answers[activeQuestionIndex]
  );
  const handleReset = () => {
    console.log(speechKey);
    setSpeechKey((prev) => prev + 1); // Forces hook reinitialization
  };

  useEffect(() => {
    setCurrentTranscript(answers[activeQuestionIndex]);
  }, [activeQuestionIndex, answers]);

  useEffect(() => {
    console.log("results are reset");
    results.length = 0;
    console.log(results);
  }, [activeQuestionIndex]);

  const handleMicToggle = () => {
    if (!window) {
      return;
    }
    if (isRecording) {
      stopSpeechToText();
    } else {
      startSpeechToText();
    }
  };

  useEffect(() => {
    console.log("updating answers");
    console.log("result is ", results.map((r) => r.transcript).join(" "));
    console.log("interimtresult is ", interimResult);

    setAnswers((prev) => {
      return prev.map((val, ind) => {
        return ind === activeQuestionIndex
          ? results.map((r) => r.transcript).join(" ") +
              (interimResult ? `${interimResult}` : "")
          : val;
      });
    });
    handleReset();
    // answers[activeQuestionIndex] =
  }, [results, activeQuestionIndex]);

  useEffect(() => {
    setCurrentTranscript(answers[activeQuestionIndex]);
  }, [answers, activeQuestionIndex]);

  const totalAnswered = () => answers.filter((ans) => ans.length >= 5).length;

  // results.map((r) => r.transcript).join(" ") +
  // (interimResult ? ` ${interimResult}` : "");

  return (
    <div className="flex flex-col items-center justify-start mt-10 w-full">
      {/* Question Display */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          {mockInterviewQuestion[activeQuestionIndex]}
        </h2>
      </div>

      {/* Webcam Section */}
      <div className="border rounded-lg p-5 w-[400px] flex flex-col items-center justify-start bg-gray-50 shadow-sm">
        {webCamEnabled ? (
          <Webcam
            audio={false}
            onUserMedia={() => setWebCamEnabled(true)}
            onUserMediaError={() => setWebCamEnabled(false)}
            mirrored
            className="rounded-lg border w-full h-[300px] object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-[300px] bg-gray-100 rounded-lg border">
            <VideoOff className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* Webcam + Mic Controls */}
        <div className="flex gap-5 mt-5">
          <Button
            variant="outline"
            className="rounded-full p-3"
            onClick={() => setWebCamEnabled((prev) => !prev)}
          >
            {webCamEnabled ? (
              <Video className="w-5 h-5 text-green-600" />
            ) : (
              <VideoOff className="w-5 h-5 text-gray-500" />
            )}
          </Button>

          <Button
            className={`rounded-full p-3 ${
              isRecording
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            onClick={handleMicToggle}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-white" />
            )}
          </Button>
        </div>
      </div>

      {/* Transcript + Debug Info */}
      <div className="mt-8 w-[400px]">
        <h3 className="text-sm text-gray-500 mb-2 font-medium">
          Live Transcript: Question {activeQuestionIndex + 1}
        </h3>
        <div className="border rounded-lg bg-gray-50 p-3 h-[120px] overflow-y-auto text-sm text-gray-800">
          {answers[activeQuestionIndex] || (
            <span className="text-gray-400 italic">
              {isRecording ? "Listening..." : "Press mic to start recording"}
            </span>
          )}
        </div>
      </div>

      {/* Record Answer Button (for future DB save) */}
      <Button
        className="mt-8 px-6 py-2 font-medium"
        // disabled={activeQuestionIndex === 4}
        onClick={() => {
          if (activeQuestionIndex !== 4) {
            if (currentTranscript.length > -1) {
              console.log("current transcript is ", currentTranscript);
              const givenAnswers = [...answers];
              givenAnswers[activeQuestionIndex] = currentTranscript;
              setAnswers(givenAnswers);
              setActiveQuestionIndex((activeQuestionIndex + 1) % 5);
              console.log("Given answers are ", givenAnswers);
            }
            console.log("Save answer:", currentTranscript);
          } else {
            if (answers.filter((val) => val.length >= 5).length === 5) {
              console.log("asking for feedback");
              const answerObject = {
                questions: mockInterviewQuestion,
                answers: answers,
              };
              setFeedback("loading");
              try {
                getFeedback(answerObject)
                  .then((res) => res)
                  .then((dat) => {
                    console.log("Feedback is ", dat);
                    setFeedback(dat);
                  });
              } catch (e) {
                console.log(e);
                setFeedback("loading");
              }
            }
          }
        }}
      >
        {activeQuestionIndex !== 4 ? `Next Question` : `Submit Answers`}
      </Button>
      {/* {totalAnswered() === 5 && (
        <Button
          disabled={answers.filter((val) => val.length >= 5).length === 5}
          onClick={() => {}}
        >
          Submit Answers
        </Button>
      )} */}

      {/* Optional: Debug Info */}
      {error && (
        <p className="text-red-500 text-sm mt-3">
          🎤 Speech recognition error: {error}
        </p>
      )}
    </div>
  );
}

export default RecordAnswerSection;
