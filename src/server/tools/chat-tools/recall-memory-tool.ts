import type { PrismaClient } from "@prisma/client";
import { publicRetrievalProfiles } from "@/server/memory/retrieval/profiles";
import { retrievePublicMemory } from "@/server/memory/retrieval/retrieve-memory";
export async function recallMemoryChatTool(args: { query?: string }, context: { prisma: PrismaClient; userId: string; problemId: string }) {
  const data = await retrievePublicMemory(context.prisma, { userId: context.userId, problemId: context.problemId, query: args.query, profile: publicRetrievalProfiles.chat });
  return {
    tool: "recall_memory" as const,
    ok: true,
    message: "Local facts and recent episodes retrieved.",
    data: {
      facts: data.facts.map(({ factType, tag, label, value, confidence, evidenceCount, lastEvidenceSummary, lastSeenAt }) => ({ factType, tag, label, value, confidence, evidenceCount, lastEvidenceSummary, lastSeenAt })),
      episodes: data.episodes.map(({ kind, title, summary, outcome, tags, createdAt }) => ({ kind, title, summary, outcome, tags: parseStringArray(tags), createdAt })),
      ftsHits: data.ftsHits,
    },
  };
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
