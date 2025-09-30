// app/(main)/dashboard/page.tsx
import { getUserInsights } from "@/actions/dashboard";
import DashboardView from "./_components/dashboard-view";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";


export type MarketOutlook = "positive" | "neutral" | "negative";
export type DemandLevel = "high" | "medium" | "low";

// helper to normalize values safely
function normalizeMarketOutlook(value: string): MarketOutlook {
  switch (value.toLowerCase()) {
    case "positive":
      return "positive";
    case "negative":
      return "negative";
    case "neutral":
    default:
      return "neutral";
  }
}

function normalizeDemandLevel(value: string): DemandLevel {
  switch (value.toLowerCase()) {
    case "high":
      return "high";
    case "low":
      return "low";
    case "medium":
    default:
      return "medium";
  }
}

export default async function DashboardPage() {
  const { isOnboarded } = await getUserOnboardingStatus();
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const insights = await getUserInsights();

  const typedInsights = {
    ...insights,
    salaryRanges: (insights.salaryRanges ?? []) as unknown as SalaryRange[],
    marketOutlook: normalizeMarketOutlook(insights.marketOutlook),
    demandLevel: normalizeDemandLevel(insights.demandLevel),
  };

  return (
    <div className="container mx-auto">
      <DashboardView insights={typedInsights} />
    </div>
  );
}
