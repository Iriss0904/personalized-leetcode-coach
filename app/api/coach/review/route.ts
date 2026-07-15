import { NextResponse } from "next/server";
import { reviewPipeline } from "@/server/agents/coach-agent/review-pipeline";
import { practiceRunRequestSchema } from "@/server/workbench/practice-run";

export async function POST(request: Request) {
  const parsed = practiceRunRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, ...(await reviewPipeline(parsed.data)) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Review failed." }, { status: 500 });
  }
}
