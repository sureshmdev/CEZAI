import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCoverLetter } from "@/actions/cover-letter";
import CoverLetterPreview from "../_components/cover-letter-preview";
import type { CoverLetter } from "@prisma/client";

interface EditCoverLetterPageProps {
  params: {
    id: string;
  };
}

export default async function EditCoverLetterPage({
  params,
}: EditCoverLetterPageProps) {
  const { id } = params;
  const coverLetter: CoverLetter | null = await getCoverLetter(id);

  if (!coverLetter) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-2">
          <Link href="/ai-cover-letter">
            <Button variant="link" className="gap-2 pl-0">
              <ArrowLeft className="h-4 w-4" />
              Back to Cover Letters
            </Button>
          </Link>
          <h1 className="text-2xl font-bold mb-6">Cover letter not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-2">
        <Link href="/cover-letter">
          <Button variant="link" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Cover Letters
          </Button>
        </Link>

        <h1 className="text-6xl font-bold gradient-title mb-6">
          {coverLetter.jobTitle} at {coverLetter.companyName}
        </h1>
      </div>

      <CoverLetterPreview
        id={coverLetter.id}
        initialContent={coverLetter.content ?? ""}
      />
    </div>
  );
}
