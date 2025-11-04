import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

const Layout = async ({ children }: { children: ReactNode }) => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex flex-col mx-auto max-w-7xl gap-12 px-8 sm:px-4">
      <main className="flex flex-col gap-8">{children}</main>
    </div>
  );
};

export default Layout;
