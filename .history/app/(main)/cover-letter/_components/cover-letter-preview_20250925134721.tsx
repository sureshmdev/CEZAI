"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import MDEditor from "@uiw/react-md-editor";
import debounce from "lodash.debounce";
import { toast } from "sonner";
import { updateCoverLetter } from "@/actions/cover-letter";

interface CoverLetterPreviewProps {
  id: string;
  initialContent: string;
}

export default function CoverLetterPreview({
  id,
  initialContent,
}: CoverLetterPreviewProps) {
  const [value, setValue] = useState(initialContent || "");

  useEffect(() => {
    setValue(initialContent || "");
  }, [initialContent]);

  const saveToDb = useCallback(
    async (newContent: string) => {
      try {
        await updateCoverLetter({ id, content: newContent });
        toast.success("Changes saved");
      } catch (error: unknown) {
        if (error instanceof Error) toast.error(error.message);
        else toast.error("Failed to save cover letter");
      }
    },
    [id]
  );

  const debouncedSave = useMemo(() => debounce(saveToDb, 2000), [saveToDb]);

  const handleChange = (val?: string) => {
    const newContent = val || "";
    setValue(newContent);
    debouncedSave(newContent);
  };

  return (
    <div className="py-4" data-color-mode="dark">
      <MDEditor value={value} onChange={handleChange} height={700} />
    </div>
  );
}
