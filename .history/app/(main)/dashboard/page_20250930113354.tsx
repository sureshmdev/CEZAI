import { getUserInsights } from "@/actions/dashboard";
import DashboardView from "./_components/dashboard-view";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";
import type { UserInsight, SalaryRange } from "@types";

export default async function DashboardPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  // If not onboarded, redirect to onboarding page
  // Skip this check if already on the onboarding page
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const rawInsights = await getUserInsights();

  const insights: UserInsight[] = rawInsights.map((insight) => ({
    ...insight,
    salaryRanges: (insight.salaryRanges as unknown as SalaryRange[]) ?? [],
    lastUpdated: new Date(insight.lastUpdated),
    nextUpdate: new Date(insight.nextUpdate),
  }));

  return (
    <div className="container mx-auto">
      <DashboardView insights={insights} />
    </div>
  );
}
