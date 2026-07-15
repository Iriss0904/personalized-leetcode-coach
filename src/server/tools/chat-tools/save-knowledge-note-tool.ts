import type { PrismaClient } from "@prisma/client";
import { upsertKnowledgeNoteFromCoach, type CoachNoteInput } from "@/server/memory/store/knowledge-note-store";
import { assertDurableWriteAuthorized, type TurnAuthorization } from "./turn-authorization";
export async function saveKnowledgeNoteChatTool(args: CoachNoteInput, context: { prisma: PrismaClient; userId: string; authorization: TurnAuthorization }) {
  assertDurableWriteAuthorized(context.authorization, "save_knowledge_note");
  const result = await upsertKnowledgeNoteFromCoach(context.prisma, { userId: context.userId, note: args });
  return result.saved
    ? {
        saved: true as const,
        noteId: result.note.id,
        title: result.note.title,
        lookupCount: result.note.lookupCount,
        alreadyExisted: result.alreadyExisted,
      }
    : result;
}
