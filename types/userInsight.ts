// userInsight.ts
import { DemandLevel, MarketOutlook, SalaryRange } from "./common";

export interface UserInsight {
  id: string;
  userId: string;
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
}
