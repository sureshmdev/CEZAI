"use client";

import React, { useState } from "react";
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

function AddNewInterview() {
  const [openDialog, setOpenDailog] = useState(false);
  const [position, setPosition] = useState();
  const [description, setDescription] = useState();
  const [experience, setExperience] = useState();
  const [type, setType] = useState();

  const onSubmit = (e) => {
    e.preventDefault();
    console.log(position, description, experience, type);
  };

  return (
    <div>
      <div
        className="p-10 border rounded-lg bg-secondary max-w-2xs hover:scale-105 hover:shadow-md cursor-pointer transition-all"
        onClick={() => setOpenDailog(true)}
      >
        <h2 className="font-bold text-lg text-center">+ Add New</h2>
      </div>
      <Dialog open={openDialog}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent className="text-2xl">
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
                  onChange={(event) => setPosition(event.target.value)}
                />
              </div>
              <div className="mt-7 my-2 space-y-2">
                <Label>Job Description / Tech Stack</Label>
                <Textarea
                  placeholder="Enter your job Description / Tech Stack"
                  required
                  onChange={(event) => setDescription(event.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Separate multiple tech stacks with commas
                </p>
              </div>
              <div className="mt-7 my-2 space-y-2">
                <Label>Years of Experinece</Label>
                <Input
                  placeholder="Enter your years of experinence"
                  type="number"
                  min="0"
                  max="50"
                  required
                  onChange={(event) => setExperience(event.target.value)}
                />
              </div>
              <div className="mt-7 my-2 space-y-2">
                <Label>Type of Interview</Label>
                <Select onValueChange={(value) => setType(value)}>
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
                      <SelectItem value="unstructued">Unstructured</SelectItem>
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
                  onClick={() => setOpenDailog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Start Interview</Button>
              </div>
            </form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddNewInterview;
