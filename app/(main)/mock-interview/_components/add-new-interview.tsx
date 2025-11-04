"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createMockInterview } from "@/actions/mock-interview";
import { toast } from "sonner";

function AddNewInterview() {
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const [position, setPosition] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [experience, setExperience] = useState<string>("");
  const [type, setType] = useState<string>("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createMockInterview({
        position,
        description,
        experience: Number(experience),
        type,
      });

      toast.success("Interview created successfully!");
      setOpenDialog(false);

      // Navigate to the interview page
      router.push(`/mock-interview/interview/${result.mockId}`);
    } catch (error) {
      console.error("Error creating interview:", error);
      toast.error("Failed to create interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        className="p-10 border rounded-lg bg-secondary max-w-2xs hover:scale-105 hover:shadow-md cursor-pointer transition-all"
        onClick={() => setOpenDialog(true)}
      >
        <h2 className="font-bold text-lg text-center">+ Add New</h2>
      </div>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogTrigger className="hidden">Open</DialogTrigger>
        <DialogContent className="text-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Tell us more about your interview
            </DialogTitle>
            <DialogDescription>
              Add details about your job position/role, job description and
              years of experience
            </DialogDescription>
            <form onSubmit={onSubmit}>
              <div className="mt-7 my-2 space-y-2">
                <Label>Job Role / Position</Label>
                <Input
                  placeholder="Enter your job role / position"
                  required
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                />
              </div>
              <div className="mt-7 my-2 space-y-2">
                <Label>Job Description / Tech Stack</Label>
                <Textarea
                  placeholder="Enter your job Description / Tech Stack"
                  required
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Separate multiple tech stacks with commas
                </p>
              </div>
              <div className="mt-7 my-2 space-y-2">
                <Label>Years of Experience</Label>
                <Input
                  placeholder="Enter your years of experience"
                  type="number"
                  min="0"
                  max="50"
                  required
                  value={experience}
                  onChange={(event) => setExperience(event.target.value)}
                />
              </div>
              <div className="mt-7 my-2 space-y-2">
                <Label>Type of Interview</Label>
                <Select onValueChange={(value) => setType(value)} value={type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Interview Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Types</SelectLabel>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="screening">
                        Phone/Video Screening
                      </SelectItem>
                      <SelectItem value="structured">Structured</SelectItem>
                      <SelectItem value="situational">Situational</SelectItem>
                      <SelectItem value="panel">Panel</SelectItem>
                      <SelectItem value="case">Case</SelectItem>
                      <SelectItem value="unstructured">Unstructured</SelectItem>
                      <SelectItem value="final">Final/On-site</SelectItem>
                      <SelectItem value="stress">Stress</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-7 flex gap-5 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenDialog(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Start Interview"}
                </Button>
              </div>
            </form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddNewInterview;
