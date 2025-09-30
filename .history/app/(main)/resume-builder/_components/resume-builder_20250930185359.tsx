// resume-builder.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Download,
  Edit,
  Loader2,
  Monitor,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import MDEditor, { PreviewType } from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { saveResume } from "@/actions/resume-builder";
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { entriesToMarkdown } from "@/app/lib/helper";
import { resumeSchema } from "@/app/lib/schema";
import html2pdf from "html2pdf.js/dist/html2pdf.min.js";

// --------------------------- TYPES ---------------------------
type ContactInfo = {
  email?: string;
  mobile?: string;
  linkedin?: string;
  twitter?: string;
};

export type Entry = {
  title: string;
  organization?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};

type MarkdownEntry = {
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  description: string;
};

type ResumeFormValues = {
  contactInfo: ContactInfo;
  summary: string;
  skills: string;
  experience: Entry[];
  education: Entry[];
  projects: Entry[];
};

// --------------------------- COMPONENT ---------------------------
export default function ResumeBuilder({
  initialContent,
}: {
  initialContent: string;
}) {
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState(initialContent);
  const { user } = useUser();
  const [resumeMode, setResumeMode] = useState<PreviewType>("preview");

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {},
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
    },
  });

  const {
    loading: isSaving,
    fn: saveResumeFn,
    error: saveError,
  } = useFetch(saveResume);

  const formValues = watch();

  useEffect(() => {
    if (initialContent) setActiveTab("preview");
  }, [initialContent]);

  // --------------------------- CONTACT MARKDOWN ---------------------------
  const getContactMarkdown = useCallback(() => {
    const { contactInfo } = formValues;
    const parts: string[] = [];
    if (contactInfo?.email) parts.push(`📧 ${contactInfo.email}`);
    if (contactInfo?.mobile) parts.push(`📱 ${contactInfo.mobile}`);
    if (contactInfo?.linkedin)
      parts.push(`💼 [LinkedIn](${contactInfo.linkedin})`);
    if (contactInfo?.twitter)
      parts.push(` [Twitter](${contactInfo.twitter})`);

    return parts.length > 0
      ? `## <div align="center">${user?.fullName ?? ""}</div>
\n\n<div align="center">\n\n${parts.join(" | ")}\n\n</div>`
      : "";
  }, [formValues, user]);

  // --------------------------- COMBINED MARKDOWN ---------------------------
  const getCombinedContent = useCallback(() => {
    const { summary, skills, experience, education, projects } = formValues;

    const mapEntries = (entries: Entry[]): MarkdownEntry[] =>
      entries.map((e) => ({
        title: e.title,
        organization: e.organization ?? "",
        startDate: e.startDate ?? "",
        endDate: e.endDate ?? "",
        description: e.description ?? "",
      }));

    return [
      getContactMarkdown(),
      summary && `## Professional Summary\n\n${summary}`,
      skills && `## Skills\n\n${skills}`,
      entriesToMarkdown(mapEntries(experience), "Work Experience"),
      entriesToMarkdown(mapEntries(education), "Education"),
      entriesToMarkdown(mapEntries(projects), "Projects"),
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [formValues, getContactMarkdown]);

  useEffect(() => {
    if (activeTab === "edit") {
      const newContent = getCombinedContent();
      setPreviewContent(newContent ? newContent : initialContent);
    }
  }, [formValues, activeTab, getCombinedContent, initialContent]);

  // --------------------------- SAVE HANDLER ---------------------------
  const onSubmit = async () => {
    try {
      const formattedContent = previewContent
        .replace(/\n/g, "\n")
        .replace(/\n\s*\n/g, "\n\n")
        .trim();

      await saveResumeFn?.(formattedContent);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  useEffect(() => {
    if (!isSaving && !saveError) {
      toast.success("Resume saved successfully!");
    }
    if (saveError) {
      toast.error(saveError.message || "Failed to save resume");
    }
  }, [saveError, isSaving]);

  // --------------------------- PDF GENERATION ---------------------------
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById("resume-pdf");
      const opt = {
        margin: [15, 15],
        filename: "resume.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      if (element) await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // --------------------------- RENDER ---------------------------
  return (
    <div data-color-mode="light" className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h1 className="font-bold gradient-title text-5xl md:text-6xl">
          Resume Builder
        </h1>
        <div className="space-x-2">
          <Button
            variant="destructive"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
          <Button onClick={generatePDF} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Form</TabsTrigger>
          <TabsTrigger value="preview">Markdown</TabsTrigger>
        </TabsList>

        {/* FORM TAB */}
        <TabsContent value="edit">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* CONTACT INFO */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                {["email", "mobile", "linkedin", "twitter"].map((field) => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <Input {...register(`contactInfo.${field}`)} />
                    {errors.contactInfo?.[field as keyof ContactInfo] && (
                      <p className="text-sm text-red-500">
                        {errors.contactInfo[
                          field as keyof ContactInfo
                        ]?.toString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SUMMARY */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Summary</h3>
              <Controller
                name="summary"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32"
                    placeholder="Write a compelling professional summary..."
                  />
                )}
              />
              {errors.summary && (
                <p className="text-sm text-red-500">
                  {errors.summary.toString()}
                </p>
              )}
            </div>

            {/* SKILLS */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Skills</h3>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32"
                    placeholder="List your key skills..."
                  />
                )}
              />
              {errors.skills && (
                <p className="text-sm text-red-500">
                  {errors.skills.toString()}
                </p>
              )}
            </div>

            {/* EXPERIENCE, EDUCATION, PROJECTS */}
            {["experience", "education", "projects"].map((section) => (
              <div key={section} className="space-y-4">
                <h3 className="text-lg font-medium">
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </h3>
                <Controller
                  name={section as keyof ResumeFormValues}
                  control={control}
                  render={({ field }) => (
                    <EntryForm
                      type={
                        section.slice(0, -1).charAt(0).toUpperCase() +
                        section.slice(1, -1)
                      }
                      entries={field.value as Entry[]}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors[section as keyof ResumeFormValues] && (
                  <p className="text-sm text-red-500">
                    {errors[section as keyof ResumeFormValues]?.toString()}
                  </p>
                )}
              </div>
            ))}
          </form>
        </TabsContent>

        {/* PREVIEW TAB */}
        <TabsContent value="preview">
          {activeTab === "preview" && (
            <Button
              variant="link"
              type="button"
              className="mb-2"
              onClick={() =>
                setResumeMode(resumeMode === "preview" ? "edit" : "preview")
              }
            >
              {resumeMode === "preview" ? (
                <>
                  <Edit className="h-4 w-4" />
                  Edit Resume
                </>
              ) : (
                <>
                  <Monitor className="h-4 w-4" />
                  Show Preview
                </>
              )}
            </Button>
          )}

          {activeTab === "preview" && resumeMode !== "preview" && (
            <div className="flex p-3 gap-2 items-center border-2 border-yellow-600 text-yellow-600 rounded mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">
                You will lose edited markdown if you update the form data.
              </span>
            </div>
          )}

          <div className="border rounded-lg">
            <MDEditor
              value={previewContent}
              onChange={setPreviewContent}
              height={800}
              preview={resumeMode}
            />
          </div>

          <div className="hidden">
            <div id="resume-pdf">
              <MDEditor.Markdown
                source={previewContent}
                style={{ background: "white", color: "black" }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
