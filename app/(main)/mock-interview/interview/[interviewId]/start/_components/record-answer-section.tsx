"use client";

import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import { getFeedback } from "@/actions/mock-interview";
import { toast } from "sonner";

interface RecordAnsSectionProps {
  mockInterviewQuestion: string[];
  activeQuestionIndex: number;
  setActiveQuestionIndex: (index: number) => void;
  mockId: string;
}

function RecordAnswerSection({
  mockInterviewQuestion,
  activeQuestionIndex,
  setActiveQuestionIndex,
  mockId,
}: RecordAnsSectionProps) {
  const router = useRouter();
  const [webCamEnabled, setWebCamEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(""));
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Speech recognition refs
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech recognition not supported");
      toast.error("Speech recognition is not supported in your browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      finalTranscriptRef.current = finalTranscript;
      const fullTranscript = finalTranscript + interimTranscript;
      setCurrentTranscript(fullTranscript);

      // Update answers array in real-time
      setAnswers((prev) => {
        const newAnswers = [...prev];
        newAnswers[activeQuestionIndex] = fullTranscript;
        return newAnswers;
      });
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        // Auto-restart on no-speech
        try {
          recognition.start();
        } catch (e) {
          // Already started
        }
      } else if (event.error === "not-allowed") {
        toast.error(
          "Microphone access denied. Please enable microphone permissions."
        );
      }
    };

    recognition.onend = () => {
      // Auto-restart if still recording
      if (isRecording) {
        try {
          recognition.start();
        } catch (e) {
          console.log("Recognition restart failed:", e);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [activeQuestionIndex, isRecording]);

  // Reset transcript when question changes
  useEffect(() => {
    finalTranscriptRef.current = answers[activeQuestionIndex] || "";
    setCurrentTranscript(answers[activeQuestionIndex] || "");
  }, [activeQuestionIndex, answers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording]);

  const handleMicToggle = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not initialized");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      toast.success("Recording stopped");
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.success("Recording started");
      } catch (e) {
        console.error("Failed to start recognition:", e);
        toast.error("Failed to start recording");
      }
    }
  };

  const handleNextQuestion = () => {
    // Save current answer
    const updatedAnswers = [...answers];
    updatedAnswers[activeQuestionIndex] = currentTranscript;
    setAnswers(updatedAnswers);

    if (activeQuestionIndex < 4) {
      // Move to next question
      setActiveQuestionIndex(activeQuestionIndex + 1);
      toast.success(`Moving to question ${activeQuestionIndex + 2}`);
    } else {
      // Submit all answers
      handleSubmit(updatedAnswers);
    }
  };

  const handleSubmit = async (finalAnswers: string[]) => {
    // Stop recording if still active
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    const answeredCount = finalAnswers.filter((ans) => ans.length >= 5).length;

    if (answeredCount < 5) {
      toast.error(
        `Please answer all questions. You've answered ${answeredCount}/5.`
      );
      return;
    }

    const answerObject = {
      questions: mockInterviewQuestion,
      answers: finalAnswers,
    };

    setIsSubmitting(true);
    toast.loading("Generating your feedback...", { id: "feedback-generation" });

    try {
      console.log("Submitting feedback for mockId:", mockId);

      // Pass the mockId as REQUIRED parameter
      const feedbackResult = await getFeedback(answerObject, mockId);

      console.log("Feedback received:", feedbackResult ? "Success" : "Failed");

      toast.success("Interview completed! Feedback generated successfully.", {
        id: "feedback-generation",
      });

      // Wait a moment for the user to see the success message
      setTimeout(() => {
        // Redirect to mock interview page
        router.push("/mock-interview");
        router.refresh(); // Force refresh to show updated data
      }, 1500);
    } catch (e) {
      console.error("Error generating feedback:", e);
      toast.error(`Failed to generate feedback: ${e.message}`, {
        id: "feedback-generation",
      });
      setIsSubmitting(false);
    }
  };

  const totalAnswered = answers.filter((ans) => ans.length >= 5).length;

  return (
    <div className="flex flex-col items-center justify-start mt-10 w-full">
      {/* Webcam Section */}
      <div className="border rounded-lg p-5 w-[400px] flex flex-col items-center justify-start bg-gray-50 shadow-sm">
        {webCamEnabled ? (
          <Webcam
            audio={false}
            onUserMedia={() => setWebCamEnabled(true)}
            onUserMediaError={() => {
              setWebCamEnabled(false);
              toast.error("Failed to access webcam");
            }}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-white" />
            )}
          </Button>
        </div>
      </div>

      {/* Transcript Display */}
      <div className="mt-8 w-[400px]">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm text-gray-500 font-medium">
            Your Answer (Question {activeQuestionIndex + 1}/5)
          </h3>
          <span className="text-xs text-gray-400">
            {totalAnswered}/5 answered
          </span>
        </div>
        <div className="border rounded-lg bg-white p-4 h-[150px] overflow-y-auto text-sm text-gray-800 shadow-sm">
          {currentTranscript.length > 0 ? (
            currentTranscript
          ) : (
            <span className="text-gray-400 italic">
              {isRecording
                ? "Listening... Start speaking your answer"
                : "Click the mic button to start recording your answer"}
            </span>
          )}
        </div>
      </div>

      {/* Navigation Button */}
      <Button
        className="mt-8 px-8 py-2 font-medium"
        onClick={handleNextQuestion}
        disabled={currentTranscript.length < 5 || isSubmitting}
      >
        {isSubmitting
          ? "Generating Feedback..."
          : activeQuestionIndex < 4
          ? "Next Question →"
          : "Submit & Get Feedback"}
      </Button>

      {/* Recording Status */}
      {isRecording && !isSubmitting && (
        <div className="mt-4 flex items-center gap-2 text-red-600 text-sm">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
          Recording in progress...
        </div>
      )}

      {/* Submission Status */}
      {isSubmitting && (
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-600 text-sm">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Processing your interview...</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This may take a few moments
          </p>
        </div>
      )}
    </div>
  );
}

export default RecordAnswerSection;
