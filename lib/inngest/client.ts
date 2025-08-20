import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "cezai", // Unique app ID
  name: "CEZAI",
  credentials: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
    },
  },
});
