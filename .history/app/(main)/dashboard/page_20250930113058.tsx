import { getUserInsights } from "@/actions/dashboard";
import DashboardView from "./_components/dashboard-view";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";
import type { SalaryRange } from "@types";

interface Insight {
  id: string;
  industry: string;
  userId: string;
  salaryRanges: SalaryRange[];
  growthRate: number;
  demandLevel: string;
  topSkills: string[];
  marketOutlook: string;
  keyTrends: string[];
  recommendedSkills: string[];
}

export default async function DashboardPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  // If not onboarded, redirect to onboarding page
  // Skip this check if already on the onboarding page
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const rawInsights: any[] = await getUserInsights();

  const insights: Insight[] = rawInsights.map((insight: any) => ({
    ...insight,
    salaryRanges: (insight.salaryRanges as unknown as SalaryRange[]) ?? [],
  }));

  return (
    <div className="container mx-auto">
      <DashboardView insights={insights} />
    </div>
  );
}
