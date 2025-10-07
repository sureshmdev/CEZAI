import React from "react";
import AddNewInterview from "./_components/add-new-interview";

function MockInterview() {
  return (
    <div>
      <h1 className="text-6xl font-bold gradient-title">Mock Interview</h1>
      <h2 className="text-muted-foreground">
        Create and Start Your AI Mock Interview
      </h2>
      <div className="gird grid-cols-1 md:grid-cols-3 my-5">
        <AddNewInterview />
      </div>
    </div>
  );
}

export default MockInterview;
