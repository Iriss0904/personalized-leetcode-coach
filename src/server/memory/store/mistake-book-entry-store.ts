import type { PrismaClient } from "@prisma/client";

export type CoachMistakeBookEntryInput = { title: string; guideMarkdown: string; selfCheckQuestion?: string; selfCheckAnswer?: string; tags?: string[] };
export function isCleanCoachMistakeBookEntry(entry: CoachMistakeBookEntryInput) { return Boolean(entry.title.trim() && entry.guideMarkdown.trim()); }
export async function upsertMistakeBookEntryFromCoach(prisma: PrismaClient, args: { userId: string; problemId: string; chatSessionId?: string; reviewAttemptId?: string; entry: CoachMistakeBookEntryInput; traceId?: string }) {
  if (!isCleanCoachMistakeBookEntry(args.entry)) return { saved: false as const, reason: "Empty entry" };
  const entry = await prisma.mistakeBookEntry.upsert({
    where: { userId_problemId: { userId: args.userId, problemId: args.problemId } },
    update: { ...args.entry, tags: JSON.stringify(args.entry.tags ?? []), saveCount: { increment: 1 }, lastSavedAt: new Date() },
    create: { userId: args.userId, problemId: args.problemId, chatSessionId: args.chatSessionId, reviewAttemptId: args.reviewAttemptId, ...args.entry, tags: JSON.stringify(args.entry.tags ?? []), sourceTraceIds: JSON.stringify(args.traceId ? [args.traceId] : []) },
  });
  return { saved: true as const, entry };
}
export function listMistakeBookEntriesForNotebook(prisma: PrismaClient, userId: string) {
  return prisma.mistakeBookEntry.findMany({ where: { userId }, include: { problem: true }, orderBy: { lastSavedAt: "desc" } });
}
