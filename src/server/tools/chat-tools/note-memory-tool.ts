import type { PrismaClient } from "@prisma/client";
import { getDefaultFtsStore } from "@/server/memory/store/fts-store";
import { assertDurableWriteAuthorized, type TurnAuthorization } from "./turn-authorization";
export async function noteMemoryChatTool(args: { tag: string; value: string }, context: { prisma: PrismaClient; userId: string; problemId: string; authorization: TurnAuthorization }) {
  assertDurableWriteAuthorized(context.authorization, "note_memory");
  const fact = await context.prisma.l2MemoryFact.upsert({ where: { userId_factType_tag: { userId: context.userId, factType: "preference", tag: args.tag } }, update: { value: args.value, lastSeenAt: new Date(), source: "user_explicit" }, create: { userId: context.userId, problemId: context.problemId, factType: "preference", tag: args.tag, value: args.value, source: "user_explicit" } });
  getDefaultFtsStore().indexMemoryDocument({
    kind: "fact",
    refId: fact.id,
    content: `${fact.tag}\n${fact.label ?? ""}\n${fact.value ?? ""}`,
  });
  return { saved: true, factId: fact.id, tag: fact.tag, value: fact.value };
}
