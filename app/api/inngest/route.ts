import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import { generateUserInsights } from "@/lib/inngest/function";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateUserInsights],
});
