import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import { generateInsights } from "@/lib/inngest/function";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateIndustryInsights],
});
