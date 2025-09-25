"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/actions/interview-prep";
import { AgentProps } from "@/types";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");

  // VAPI Event Handlers
  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
    const onCallEnd = () => setCallStatus(CallStatus.FINISHED);
    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        setMessages((prev) => [
          ...prev,
          { role: message.role, content: message.transcript },
        ]);
      }
    };
    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = (error: Error) => console.error("Error:", error);

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  // Handle Feedback Generation
  useEffect(() => {
    if (messages.length > 0)
      setLastMessage(messages[messages.length - 1].content);

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });

      if (success && id) router.push(`/interview/${interviewId}/feedback`);
      else router.push("/");
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") router.push("/");
      else handleGenerateFeedback(messages);
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  // Call & Disconnect Handlers
  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
        variableValues: { username: userName, userid: userId },
      });
    } else {
      const formattedQuestions =
        questions?.map((q) => `- ${q}`).join("\n") ?? "";
      await vapi.start(interviewer, {
        variableValues: { questions: formattedQuestions },
      });
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* AI Interviewer & User Profile Cards */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* AI Interviewer */}
        <Card className="flex-1 flex flex-col justify-center items-center gap-4 p-6 min-h-[420px]">
          <CardContent className="flex flex-col justify-center items-center gap-4">
            <div className="relative">
              <Image
                src="/ai-avatar.png"
                alt="AI Interviewer"
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
              {isSpeaking && (
                <span className="absolute inset-0 rounded-full animate-ping" />
              )}
            </div>
            <CardTitle className="text-lg md:text-xl">AI Interviewer</CardTitle>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card className="flex-1 flex flex-col justify-center items-center gap-4 p-6 min-h-[420px]">
          <CardContent className="flex flex-col justify-center items-center gap-4">
            <Image
              src="/profile.svg"
              alt={userName}
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
            <CardTitle className="text-lg md:text-xl">{userName}</CardTitle>
          </CardContent>
        </Card>
      </div>

      {/* Transcript */}
      {messages.length > 0 && (
        <Card className="p-4">
          <CardContent>
            <p className={cn("transition-opacity duration-500 animate-fadeIn")}>
              {lastMessage}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Call Controls */}
      <div className="flex justify-center gap-4">
        {callStatus !== CallStatus.ACTIVE ? (
          <Button
            variant="default"
            onClick={handleCall}
            className="relative px-6 py-3 font-semibold"
          >
            {callStatus === CallStatus.CONNECTING && (
              <span className="absolute inset-0 animate-ping rounded-full" />
            )}
            <span>
              {callStatus === CallStatus.INACTIVE ||
              callStatus === CallStatus.FINISHED
                ? "Call"
                : "..."}
            </span>
          </Button>
        ) : (
          <Button variant="destructive" onClick={handleDisconnect}>
            End
          </Button>
        )}
      </div>
    </div>
  );
};

export default Agent;
