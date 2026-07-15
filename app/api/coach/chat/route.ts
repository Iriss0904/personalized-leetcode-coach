import { NextResponse } from "next/server";
import { z } from "zod";
import { chatReply } from "@/server/agents/coach-agent/chat-reply";
import { codeRunTestCaseSchema } from "@/types/code-runner";

const schema = z.object({
  problemSlug: z.string().min(1),
  message: z.string().trim().min(1).max(4000),
  code: z.string().max(100_000),
  language: z.literal("Python"),
  testCases: z.array(codeRunTestCaseSchema).min(1).max(20),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, ...(await chatReply(parsed.data)) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Chat failed." }, { status: 500 });
  }
}
