import { NextResponse } from "next/server";
import { z } from "zod";
import { createCustomTestCase } from "@/features/workbench/actions";

const inputSchema = z.object({
  problemSlug: z.string().trim().min(1),
  label: z.string().trim().max(120),
  input: z.record(z.string(), z.unknown()),
  expected: z.unknown(),
});

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid custom test request." }, { status: 400 });
  }
  try {
    return NextResponse.json(await createCustomTestCase(parsed.data));
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not save the custom test." },
      { status: 500 },
    );
  }
}
