import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] px-4 text-center">
      <h1 className="text-6xl font-bold gradient-title mb-4">🚀</h1>
      <h2 className="text-3xl font-semibold mb-4">Coming Soon!</h2>
      <p className="text-gray-600 mb-8">
        We are working hard to bring you this feature. Stay tuned!
      </p>
      <Link href="/" passHref>
        <Button>Return Home</Button>
      </Link>
    </div>
  );
}
