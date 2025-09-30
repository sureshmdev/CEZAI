import { BarLoader } from "react-spinners";
import { ReactNode, Suspense } from "react";
import { ShinyText } from "@/components/";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold gradient-title">Industry Insight</h1>
      </div>
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="gray" />}
      >
        {children}
      </Suspense>
    </div>
  );
}
