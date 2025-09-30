import { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return <div className="container mx-auto mt-8 mb-20">{children}</div>;
}
