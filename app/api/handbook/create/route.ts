import { NextResponse } from "next/server";
import { z } from "zod";
import { localUserHandle } from "@/features/onboarding/profile-defaults";
import prisma from "@/server/db/prisma";
import {
  createKnowledgeNote,
  KNOWLEDGE_NOTE_CATEGORIES,
} from "@/server/memory/store/knowledge-note-store";
import { getDefaultFtsStore } from "@/server/memory/store/fts-store";

export const runtime = "nodejs";

const bodySchema = z.object({
  conceptKey: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(80),
  snippet: z.string().trim().min(1).max(800),
  whenToUse: z.string().trim().min(1).max(160),
  category: z.enum(KNOWLEDGE_NOTE_CATEGORIES),
});

export async function POST(request: Request) {
  try {
    const note = bodySchema.parse(await request.json());
    const user = await prisma.user.upsert({
      where: { handle: localUserHandle },
      update: {},
      create: { handle: localUserHandle },
    });
    const created = await createKnowledgeNote(prisma, {
      userId: user.id,
      note,
      ftsStore: getDefaultFtsStore(),
    });
    return NextResponse.json({ ok: true, noteId: created.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ ok: false, error: "无法新建条目。" }, { status: 500 });
  }
}
