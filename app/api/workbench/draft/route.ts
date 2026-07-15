import { NextResponse } from "next/server";
import { z } from "zod";
import { saveDraftState } from "@/features/workbench/actions";

const inputSchema = z.object({
  problemSlug: z.string().trim().min(1),
  content: z.string().max(200_000),
  selectedTestCaseIds: z.array(z.string()).max(20),
});

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid draft save request." }, { status: 400 });
  }
  try {
    return NextResponse.json(await saveDraftState(parsed.data));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not save the local draft." },
      { status: 500 },
    );
  }
}
