"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Target,
  AlertTriangle,
} from "lucide-react";

interface FeedbackScore {
  category: string;
  score: number;
  maxScore: number;
  feedback: string;
  improvements: string[];
}

interface InterviewFeedback {
  overallScore: number;
  overallGrade: string;
  categories: FeedbackScore[];
  strengths: string[];
  criticalWeaknesses: string[];
  detailedAnalysis: string;
  industryBenchmark: string;
  actionableSteps: string[];
}

interface FeedbackDisplayProps {
  feedbackJson: string;
}

export function FeedbackDisplay({ feedbackJson }: FeedbackDisplayProps) {
  let feedback: InterviewFeedback;

  try {
    feedback = JSON.parse(feedbackJson);
  } catch (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load feedback. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-green-100 text-green-800";
    if (grade.startsWith("B")) return "bg-blue-100 text-blue-800";
    if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-800";
    if (grade.startsWith("D")) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Interview Performance</CardTitle>
              <CardDescription>
                Honest assessment based on industry standards
              </CardDescription>
            </div>
            <div className="text-center">
              <div
                className={`text-4xl font-bold ${getScoreColor(
                  feedback.overallScore
                )}`}
              >
                {feedback.overallScore}
              </div>
              <Badge className={getGradeColor(feedback.overallGrade)}>
                {feedback.overallGrade}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Category Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>
            Detailed scores by evaluation criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {feedback.categories.map((category, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{category.category}</h3>
                <span
                  className={`text-lg font-bold ${getScoreColor(
                    category.score
                  )}`}
                >
                  {category.score}/100
                </span>
              </div>
              <Progress value={category.score} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {category.feedback}
              </p>

              {category.improvements.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-2">
                    Areas for Improvement:
                  </p>
                  <ul className="text-sm space-y-1">
                    {category.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Target className="w-4 h-4 mt-0.5 text-orange-500 flex-shrink-0" />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strengths */}
      {feedback.strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Critical Weaknesses */}
      {feedback.criticalWeaknesses.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              Critical Areas to Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.criticalWeaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 mt-0.5 text-red-600 flex-shrink-0" />
                  <span className="text-sm">{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-line">
            {feedback.detailedAnalysis}
          </p>
        </CardContent>
      </Card>

      {/* Industry Benchmark */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Industry Benchmark
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{feedback.industryBenchmark}</p>
        </CardContent>
      </Card>

      {/* Actionable Steps */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-700">Next Steps</CardTitle>
          <CardDescription>
            Concrete actions to improve your performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {feedback.actionableSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
