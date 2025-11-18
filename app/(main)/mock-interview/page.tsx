import React from "react";
import AddNewInterview from "./_components/add-new-interview";
import { InterviewList } from "./_components/interview-list";
import { getUserInterviews } from "@/actions/mock-interview";

async function MockInterview() {
  // Fetch user's interviews
  let interviews = [];
  try {
    interviews = await getUserInterviews();
  } catch (error) {
    console.error("Failed to load interviews:", error);
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-6xl font-bold gradient-title">Mock Interview</h1>
        <h2 className="text-muted-foreground mt-2">
          Create and Start Your AI Mock Interview
        </h2>
      </div>

      {/* Add New Interview Section */}
      <div className="mb-10">
        <h3 className="text-2xl font-semibold mb-4">Create New Interview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <AddNewInterview />
        </div>
      </div>

      {/* Previous Interviews Section */}
      <div>
        <h3 className="text-2xl font-semibold mb-4">
          Your Previous Interviews ({interviews.length})
        </h3>
        <InterviewList interviews={interviews} />
      </div>
    </div>
  );
}

export default MockInterview;
