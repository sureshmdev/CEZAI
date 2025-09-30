export interface MarkdownEntry {
  title: string;
  organization: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export function entriesToMarkdown(
  entries: MarkdownEntry[],
  type: string
): string {
  if (!entries?.length) return "";

  return (
    `## ${type}\n\n` +
    entries
      .map((entry: MarkdownEntry) => {
        const dateRange = entry.current
          ? `${entry.startDate} - Present`
          : `${entry.startDate} - ${entry.endDate ?? ""}`;

        return `### ${entry.title} @ ${entry.organization}\n${dateRange}\n\n${
          entry.description ?? ""
        }`;
      })
      .join("\n\n")
  );
}
