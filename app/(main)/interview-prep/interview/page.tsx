import Agent from "../interview/_components/Agent";
import { auth } from "@clerk/nextjs/server";

const Page = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return (
    <>
      <h3>Interview generation</h3>

      <Agent userName="User" userId={userId} type="generate" />
    </>
  );
};

export default Page;
