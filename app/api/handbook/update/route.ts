import { NextResponse } from "next/server";
import { z } from "zod";
import { localUserHandle } from "@/features/onboarding/profile-defaults";
import prisma from "@/server/db/prisma";
import {
  KNOWLEDGE_NOTE_CATEGORIES,
  updateKnowledgeNote,
} from "@/server/memory/store/knowledge-note-store";
import { getDefaultFtsStore } from "@/server/memory/store/fts-store";

export const runtime = "nodejs";

const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(80).optional(),
    snippet: z.string().trim().min(1).max(800).optional(),
    whenToUse: z.string().trim().min(1).max(160).optional(),
    category: z.enum(KNOWLEDGE_NOTE_CATEGORIES).optional(),
  })
  .strict();

const bodySchema = z.object({
  noteId: z.string().trim().min(1),
  patch: patchSchema,
});

export async function POST(request: Request) {
  try {
    const { noteId, patch } = bodySchema.parse(await request.json());
    const user = await prisma.user.upsert({
      where: { handle: localUserHandle },
      update: {},
      create: { handle: localUserHandle },
    });
    await updateKnowledgeNote(prisma, {
      userId: user.id,
      noteId,
      patch,
      ftsStore: getDefaultFtsStore(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ ok: false, error: "无法更新条目。" }, { status: 500 });
  }
}
