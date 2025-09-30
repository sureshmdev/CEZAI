"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { generateQuiz, saveQuizResult } from "@/actions/smart-assessment";
import QuizResult from "./quiz-result";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";

import type {
  QuizQuestionInput,
  QuizResultInput,
  Assessment, // domain type (clean)
} from "@types";
import type { Assessment as RawAssessment } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";

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

function mapToAssessment(raw: RawAssessment): Assessment {
  const mappedQuestions: QuizResultInput[] = (raw.questions as JsonValue[]).map(
    (q) => {
      if (isQuizResultInput(q)) {
        return {
          question: String(q.question),
          answer: String(q.answer),
          userAnswer: String(q.userAnswer),
          isCorrect: Boolean(q.isCorrect),
          explanation: String(q.explanation),
        };
      }
      throw new Error("Invalid quiz result format");
    }
  );

  return {
    ...raw,
    questions: mappedQuestions,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  };
}

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  const {
    loading: generatingQuiz,
    fn: generateQuizFn,
    data: quizData,
  } = useFetch<QuizQuestionInput[], []>(generateQuiz);

  const {
    loading: savingResult,
    fn: saveQuizResultFn,
    data: rawResultData, // RawAssessment
    setData: setRawResultData,
  } = useFetch<RawAssessment, [QuizQuestionInput[], string[], number]>(
    saveQuizResult
  );

  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(""));
      setCurrentQuestion(0);
      setShowExplanation(false);
    }
  }, [quizData]);

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const calculateScore = (): number => {
    if (!quizData) return 0;
    let correct = 0;
    answers.forEach((answer, idx) => {
      if (answer === quizData[idx].correctAnswer) correct++;
    });
    return (correct / quizData.length) * 100;
  };

  const finishQuiz = async () => {
    if (!quizData) return;

    const score = calculateScore();
    try {
      await saveQuizResultFn(quizData, answers, score);
      toast.success("Quiz completed!");
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error("Failed to save quiz results");
    }
  };

  const handleNext = () => {
    if (!quizData) return;
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setShowExplanation(false);
    } else {
      void finishQuiz();
    }
  };

  const startNewQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowExplanation(false);
    setRawResultData(undefined);
    generateQuizFn();
  };

  if (generatingQuiz)
    return <BarLoader className="mt-4" width="100%" color="gray" />;

  if (rawResultData) {
    const assessment: Assessment = mapToAssessment(rawResultData);

    return (
      <div className="mx-2">
        <QuizResult
          result={{
            quizScore: assessment.quizScore,
            improvementTip: assessment.improvementTip ?? undefined,
            questions: assessment.questions,
          }}
          onStartNew={startNewQuiz}
        />
      </div>
    );
  }

  if (!quizData)
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>Ready to test your knowledge?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This quiz contains 10 questions specific to your industry and
            skills. Take your time and choose the best answer for each question.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={generateQuizFn} className="w-full">
            Start Quiz
          </Button>
        </CardFooter>
      </Card>
    );

  const question = quizData[currentQuestion];

  return (
    <Card className="mx-2">
      <CardHeader>
        <CardTitle>
          Question {currentQuestion + 1} of {quizData.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-medium">{question.question}</p>
        <RadioGroup
          onValueChange={handleAnswer}
          value={answers[currentQuestion]}
          className="space-y-2"
        >
          {question.options.map((option, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`option-${idx}`} />
              <Label htmlFor={`option-${idx}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>
        {showExplanation && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium">Explanation:</p>
            <p className="text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!showExplanation && (
          <Button
            onClick={() => setShowExplanation(true)}
            variant="outline"
            disabled={!answers[currentQuestion]}
          >
            Show Explanation
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!answers[currentQuestion] || savingResult}
          className="ml-auto"
        >
          {savingResult && (
            <BarLoader className="mt-4" width="100%" color="gray" />
          )}
          {currentQuestion < quizData.length - 1
            ? "Next Question"
            : "Finish Quiz"}
        </Button>
      </CardFooter>
    </Card>
  );
}
