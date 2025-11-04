import { getAssessments } from "@/actions/smart-assessment";
import StatsCards from "./_components/stats-cards";
import PerformanceChart from "./_components/performance-chart";
import QuizList from "./_components/quiz-list";
import type { RawAssessment, Assessment, QuizResultInput } from "@types";

function isQuizResultInput(obj: unknown): obj is QuizResultInput {
  if (!obj || typeof obj !== "object") return false;
  const q = obj as Record<string, unknown>;
  return (
    typeof q.question === "string" &&
    typeof q.answer === "string" &&
    typeof q.userAnswer === "string" &&
    typeof q.isCorrect === "boolean" &&
    typeof q.explanation === "string"
  );
}

function mapRawAssessment(raw: RawAssessment): Assessment {
  const questions: QuizResultInput[] = (raw.questions as unknown[]).map((q) => {
    if (isQuizResultInput(q)) return q;
    throw new Error("Invalid quiz result format");
  });

  return {
    id: raw.id,
    userId: raw.userId,
    quizScore: raw.quizScore,
    category: raw.category,
    questions,
    improvementTip: raw.improvementTip ?? undefined,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  };
}

export default async function InterviewPrepPage() {
  const rawAssessments = await getAssessments(); // RawAssessment[]
  const assessments: Assessment[] = rawAssessments.map(mapRawAssessment);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold gradient-title">Smart Assessment</h1>
      </div>
      <div className="space-y-6">
        <StatsCards assessments={assessments} />
        <PerformanceChart assessments={assessments} />
        <QuizList assessments={assessments} />
      </div>
    </div>
  );
}
