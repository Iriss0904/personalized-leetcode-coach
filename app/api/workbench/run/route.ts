import { NextResponse } from "next/server";
import { executePracticeRun, practiceRunRequestSchema } from "@/server/workbench/practice-run";

export async function POST(request: Request) {
  const parsed = practiceRunRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid Python run request." }, { status: 400 });
  }
  try {
    const result = await executePracticeRun(parsed.data);
    return NextResponse.json({ ok: true, persisted: result.persisted, runResult: result.runResult });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Run failed." },
      { status: 500 },
    );
  }
}
