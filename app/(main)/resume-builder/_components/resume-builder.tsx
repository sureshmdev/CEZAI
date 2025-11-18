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

import type {
  ContactInfo,
  Entry,
  MarkdownEntry,
  ResumeFormValues,
} from "@types";
type JsPDFInstance = import("jspdf").jsPDF;

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

  const upgradeLegacyHeader = useCallback((content: string) => {
    const headerRegex =
      /##\s*<div[^>]*align=["']center["'][^>]*>(.*?)<\/div>\s*<div[^>]*align=["']center["'][^>]*>\s*([\s\S]*?)\s*<\/div>/i;

    return content.replace(headerRegex, (_, name, contactBlock) => {
      const safeName = name.trim();
      const contactLine = contactBlock
        .split("|")
        .map((item: string) => item.trim())
        .filter(Boolean)
        .join(" | ");

      const nameMarkup = safeName
        ? `<h1 style="text-align:center;margin:0;font-size:2rem;font-weight:bold;">${safeName}</h1>`
        : "";
      const contactMarkup = contactLine
        ? `<p style="text-align:center;margin-top:0.5rem;">${contactLine}</p>`
        : "";

      return [nameMarkup, contactMarkup].filter(Boolean).join("\n\n");
    });
  }, []);

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
    if (initialContent && initialContent.includes('## <div align="center">')) {
      setPreviewContent((prev) =>
        prev === initialContent ? upgradeLegacyHeader(initialContent) : prev
      );
    }
  }, [initialContent, upgradeLegacyHeader]);

  useEffect(() => {
    if (initialContent) setActiveTab("preview");
  }, [initialContent]);

  // --------------------------- CONTACT MARKDOWN ---------------------------
  const getContactMarkdown = useCallback(() => {
    const { contactInfo } = formValues;
    const parts: string[] = [];

    const name = user?.fullName ?? "";

    // Build contact info parts with clickable links
    if (contactInfo?.email)
      parts.push(`[${contactInfo.email}](mailto:${contactInfo.email})`);
    if (contactInfo?.mobile)
      parts.push(`[${contactInfo.mobile}](tel:${contactInfo.mobile})`);
    if (contactInfo?.linkedin)
      parts.push(`[LinkedIn](${contactInfo.linkedin})`);
    if (contactInfo?.twitter) parts.push(`[Twitter](${contactInfo.twitter})`);

    // Create centered name
    const nameMarkup = name
      ? `<h1 style="text-align:center;margin:0;font-size:2rem;font-weight:bold;">${name}</h1>`
      : "";

    // Create centered contact info on separate line
    const contactMarkup =
      parts.length > 0
        ? `<p style="text-align:center;margin-top:0.5rem;">${parts.join(
            " | "
          )}</p>`
        : "";

    return [nameMarkup, contactMarkup].filter(Boolean).join("\n\n");
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
      summary &&
        `<h2 style="font-weight:bold;">Professional Summary</h2>\n\n${summary}`,
      skills && `<h2 style="font-weight:bold;">Skills</h2>\n\n${skills}`,
      experience.length > 0 &&
        `<h2 style="font-weight:bold;">Work Experience</h2>\n\n${entriesToMarkdown(
          mapEntries(experience),
          ""
        )}`,
      education.length > 0 &&
        `<h2 style="font-weight:bold;">Education</h2>\n\n${entriesToMarkdown(
          mapEntries(education),
          ""
        )}`,
      projects.length > 0 &&
        `<h2 style="font-weight:bold;">Projects</h2>\n\n${entriesToMarkdown(
          mapEntries(projects),
          ""
        )}`,
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

  const PAGE_MARGIN = 12;

  const addTextBlock = (
    doc: JsPDFInstance,
    text: string,
    options: {
      fontSize?: number;
      fontStyle?: "normal" | "bold";
      lineHeight?: number;
      indent?: number;
      spacingBefore?: number;
    },
    cursor: { y: number }
  ) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = doc.internal.pageSize.getWidth() - PAGE_MARGIN * 2;
    const {
      fontSize = 11,
      fontStyle = "normal",
      lineHeight = 5.5,
      indent = 0,
      spacingBefore = 1,
    } = options;

    cursor.y += spacingBefore;

    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);

    const lines = doc.splitTextToSize(text, maxWidth - indent);

    lines.forEach((line) => {
      if (cursor.y + lineHeight > pageHeight - PAGE_MARGIN) {
        doc.addPage();
        cursor.y = PAGE_MARGIN;
      }
      doc.text(line, PAGE_MARGIN + indent, cursor.y);
      cursor.y += lineHeight;
    });
  };

  const sanitizeContent = (value: string) =>
    value
      .replace(/\r\n/g, "\n")
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "$1")
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "$1")
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<div[^>]*>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/?strong>/gi, "")
      .replace(/<\/?em>/gi, "")
      .replace(/<\/?span[^>]*>/gi, "")
      .replace(/\*\*/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/^##\s+/gm, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\t+/g, " ")
      .replace(/ {2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[^\x20-\x7E\n•]/g, "")
      .trim();

  const splitContent = (value: string) => {
    const sanitized = sanitizeContent(value);
    const lines = sanitized.split("\n").map((line) => line.trimEnd());
    const headerLines: string[] = [];
    const bodyLines: string[] = [];
    let readingHeader = true;

    lines.forEach((originalLine) => {
      const line = originalLine.trim();

      if (!line) {
        if (!readingHeader) bodyLines.push("");
        return;
      }

      const looksStructured =
        /^#{1,6}\s+/.test(line) ||
        /^[-*+]\s+/.test(line) ||
        /^\d+\.\s+/.test(line) ||
        line.startsWith("```") ||
        /^(Professional Summary|Skills|Education|Projects|Work Experience)$/i.test(
          line
        );

      if (readingHeader && !looksStructured) {
        headerLines.push(line);
        return;
      }

      readingHeader = false;
      bodyLines.push(originalLine);
    });

    return { headerLines, bodyLines };
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      const margin = 12;
      const pageWidth = doc.internal.pageSize.getWidth();
      const { headerLines, bodyLines } = splitContent(previewContent);
      const cursor = { y: 20 };

      // ===========================
      // 🧠 HEADER
      // ===========================
      if (headerLines.length > 0) {
        const [name, contactLine] = headerLines;

        // Name — bold, centered, large
        if (name) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(24);
          doc.text(name, pageWidth / 2, cursor.y, {
            align: "center",
          });
          cursor.y += 7;
        }

        // Contact info — centered below name
        if (contactLine) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(contactLine, pageWidth / 2, cursor.y, {
            align: "center",
            maxWidth: pageWidth - margin * 2,
          });
          cursor.y += 8;
        }

        // Divider line
        doc.setDrawColor(180);
        doc.setLineWidth(0.1);
        doc.line(margin, cursor.y, pageWidth - margin, cursor.y);
        cursor.y += 6;
      }

      const lines = bodyLines;
      const sectionHeaders = [
        "Professional Summary",
        "Skills",
        "Education",
        "Projects",
        "Work Experience",
      ];

      lines.forEach((line) => {
        const trimmed = line.trim();
        const normalized = trimmed
          .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
          .replace(/\*\*(.*?)\*\*/g, "$1");

        if (!trimmed) {
          cursor.y += 2;
          return;
        }

        // Check if line is a section header
        if (sectionHeaders.includes(trimmed)) {
          addTextBlock(
            doc,
            trimmed,
            {
              fontSize: 16,
              fontStyle: "bold",
              lineHeight: 8,
              spacingBefore: 6,
            },
            cursor
          );
          cursor.y += 2;
          return;
        }

        if (trimmed.startsWith("### ")) {
          addTextBlock(
            doc,
            normalized.replace(/^###\s+/, ""),
            {
              fontSize: 13,
              fontStyle: "bold",
              lineHeight: 6.5,
              spacingBefore: 4,
            },
            cursor
          );
          cursor.y += 1.5;
          return;
        }

        if (trimmed.startsWith("## ")) {
          addTextBlock(
            doc,
            normalized.replace(/^##\s+/, ""),
            {
              fontSize: 15,
              fontStyle: "bold",
              lineHeight: 7.5,
              spacingBefore: 5,
            },
            cursor
          );
          cursor.y += 2;
          return;
        }

        if (trimmed.startsWith("# ")) {
          addTextBlock(
            doc,
            normalized.replace(/^#\s+/, ""),
            {
              fontSize: 18,
              fontStyle: "bold",
              lineHeight: 9,
              spacingBefore: 8,
            },
            cursor
          );
          cursor.y += 3;
          return;
        }

        if (trimmed.startsWith("- ")) {
          addTextBlock(
            doc,
            `• ${normalized.slice(2)}`,
            { fontSize: 11, lineHeight: 5.2, indent: 4, spacingBefore: 1.5 },
            cursor
          );
          cursor.y += 0.5;
          return;
        }

        addTextBlock(
          doc,
          normalized,
          { fontSize: 11, lineHeight: 5.2, spacingBefore: 1.5 },
          cursor
        );
        cursor.y += 1;
      });

      doc.save("resume.pdf");
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // --------------------------- RENDER ---------------------------
  return (
    <div data-color-mode="light" className="relative space-y-4">
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
          <div className="space-y-8">
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
            {["experience", "education", "projects"].map((section) => {
              const typeMap: Record<string, string> = {
                experience: "Experience",
                education: "Education",
                projects: "Project",
              };
              return (
                <div key={section} className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </h3>
                  <Controller
                    name={section as keyof ResumeFormValues}
                    control={control}
                    render={({ field }) => (
                      <EntryForm
                        type={typeMap[section]}
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
              );
            })}
          </div>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
