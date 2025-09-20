// app/api/debug-auth/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    return NextResponse.json({ ok: true, userId });
  } catch (e) {
    console.error("Clerk auth error:", e);
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
