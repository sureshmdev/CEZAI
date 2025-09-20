// industryInsights.ts
import { DemandLevel, MarketOutlook, SalaryRange } from "./common";
import { User } from "./user";

export interface IndustryInsight {
  id: string;
  industry: string;

  salaryRanges: SalaryRange[];
  growthRate: number;
  demandLevel: DemandLevel;
  topSkills: string[];
  marketOutlook: MarketOutlook;
  keyTrends: string[];
  recommendedSkills: string[];

  lastUpdated: Date;
  nextUpdate: Date;

  users: User[];
}
