import type { PrismaClient } from "@prisma/client";
import { upsertMistakeBookEntryFromCoach, type CoachMistakeBookEntryInput } from "@/server/memory/store/mistake-book-entry-store";
import { assertDurableWriteAuthorized, type TurnAuthorization } from "./turn-authorization";
export async function saveMistakeBookEntryChatTool(args: CoachMistakeBookEntryInput, context: { prisma: PrismaClient; userId: string; problemId: string; authorization: TurnAuthorization }) {
  assertDurableWriteAuthorized(context.authorization, "save_mistake_book_entry");
  const result = await upsertMistakeBookEntryFromCoach(context.prisma, { userId: context.userId, problemId: context.problemId, entry: args });
  return result.saved
    ? {
        saved: true as const,
        entryId: result.entry.id,
        title: result.entry.title,
        saveCount: result.entry.saveCount,
      }
    : result;
}
