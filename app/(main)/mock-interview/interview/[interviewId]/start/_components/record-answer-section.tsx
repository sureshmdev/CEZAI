"use client";

import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import { getFeedback } from "@/actions/mock-interview";
import { toast } from "sonner";
import { useInterviewerTTS } from "@/app/(main)/mock-interview/_components/interviewerTTS";

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
  const { readQuestion, stopSpeaking, isSpeaking } = useInterviewerTTS({
    enableBackgroundNoise: true,
    rate: 0.9,
    pitch: 0.9,
    volume: 0.9,
  });
  // const [answers, setAnswers] = useState<string[]>([
  //   "question",
  //   "question",
  //   "question",
  //   "question",
  //   "question",
  // ]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  //const [interviewerGender, setInterveiwerGender] = useState("male");
  // const [isRecording, setIsRecording] = useState(false);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    stopSpeaking();
    const questionText = mockInterviewQuestion[activeQuestionIndex];
    console.log("Current question text is: ", questionText);
    readQuestion(questionText);
  }, [activeQuestionIndex]);

  /* ---------------------------
   INITIALIZE SPEECH RECOGNITION (ONLY ONCE)
---------------------------- */
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
      let interim = "";
      let finalTxt = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTxt += transcript + " ";
        } else {
          interim += transcript;
        }
      }

      finalTranscriptRef.current = finalTxt;
      const full = finalTxt + interim;

      setCurrentTranscript(full);

      // Live update
      setAnswers((prev) => {
        const copy = [...prev];
        copy[activeQuestionIndex] = full;
        return copy;
      });
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied.");
      }
    };

    // Auto restart to keep mic alive
    recognition.onend = () => {
      if (isRecording) {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  /* ---------------------------
   UPDATE TRANSCRIPT ONLY WHEN NOT RECORDING
---------------------------- */
  useEffect(() => {
    if (!isRecording) {
      finalTranscriptRef.current = answers[activeQuestionIndex] || "";
      setCurrentTranscript(answers[activeQuestionIndex] || "");
    }
  }, [activeQuestionIndex, answers, isRecording]);

  /* ---------------------------
   MIC TOGGLE
---------------------------- */
  const handleMicToggle = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not initialized");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // Reset everything when starting
      finalTranscriptRef.current = "";
      setCurrentTranscript("");

      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Failed to start recognition:", e);
        toast.error("Failed to start recording");
      }
    }
  };

  /* ---------------------------
   NEXT QUESTION HANDLER
---------------------------- */
  const handleNextQuestion = () => {
    const updated = [...answers];
    updated[activeQuestionIndex] = currentTranscript;
    setAnswers(updated);

    if (activeQuestionIndex < 4) {
      setActiveQuestionIndex(activeQuestionIndex + 1);
      toast.success(`Moving to question ${activeQuestionIndex + 2}`);

      // Auto-continue recording smoothly
      finalTranscriptRef.current = "";
      setCurrentTranscript("");
    } else {
      handleSubmit(updated);
    }
  };

  /* ---------------------------
   CLEANUP
---------------------------- */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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
