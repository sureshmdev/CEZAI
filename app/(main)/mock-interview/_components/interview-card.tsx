"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, FileText, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { FeedbackDisplay } from "./feedback-display";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteMockInterview } from "@/actions/mock-interview";

interface InterviewCardProps {
  interview: {
    id: string;
    mockId: string;
    position: string;
    description: string;
    experience: number;
    type: string;
    feedback?: string;
    createdAt: Date;
  };
  onDelete?: (id: string) => void;
}

export function InterviewCard({ interview }: InterviewCardProps) {
  const router = useRouter();
  const [showFeedback, setShowFeedback] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRetake = () => {
    router.push(`/mock-interview/interview/${interview.mockId}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMockInterview(interview.mockId);
      toast.success("Interview deleted successfully");
      setShowDeleteDialog(false);
      router.refresh(); // Refresh the page to update the list
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete interview");
    } finally {
      setIsDeleting(false);
    }
  };

  // Get interview type badge color
  const getTypeBadgeVariant = (type: string) => {
    const variants: Record<string, string> = {
      technical: "bg-blue-100 text-blue-800",
      behavioral: "bg-purple-100 text-purple-800",
      screening: "bg-green-100 text-green-800",
      panel: "bg-orange-100 text-orange-800",
      case: "bg-pink-100 text-pink-800",
      final: "bg-red-100 text-red-800",
    };
    return variants[type.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const hasFeedback = interview.feedback && interview.feedback.length > 0;

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300 flex flex-col h-full">
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl truncate">
                {interview.position}
              </CardTitle>
              <CardDescription className="mt-2 line-clamp-2">
                {interview.description}
              </CardDescription>
            </div>
            <Badge className={getTypeBadgeVariant(interview.type)}>
              {interview.type}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-grow">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>
                {format(new Date(interview.createdAt), "MMM dd, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{interview.experience} years experience</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span>
                {hasFeedback ? (
                  <span className="text-green-600 font-medium">
                    Feedback Available
                  </span>
                ) : (
                  <span className="text-orange-600">No feedback yet</span>
                )}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 pt-4 border-t">
          <Button
            variant="default"
            className="flex-1"
            onClick={handleRetake}
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake
          </Button>

          {hasFeedback && (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowFeedback(true)}
              size="sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              Feedback
            </Button>
          )}

          <Button
            variant="destructive"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interview Feedback</DialogTitle>
            <DialogDescription>
              Honest assessment for {interview.position}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {hasFeedback ? (
              <FeedbackDisplay feedbackJson={interview.feedback!} />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No feedback available for this interview.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the interview for{" "}
              <strong>{interview.position}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
