"use client";

import React from "react";
import { InterviewCard } from "./interview-card";
import type { MockInterview } from "@prisma/client";

interface InterviewListProps {
  interviews: MockInterview[];
}

export function InterviewList({ interviews }: InterviewListProps) {
  if (interviews.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <h3 className="text-lg font-semibold mb-2">No interviews yet</h3>
        <p className="text-muted-foreground">
          Create your first AI mock interview to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {interviews.map((interview) => (
        <InterviewCard key={interview.id} interview={interview} />
      ))}
    </div>
  );
}
