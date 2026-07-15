import type { PrismaClient } from "@prisma/client";
import type { PublicRetrievalProfile } from "./profiles";
import { getDefaultFtsStore } from "../store/fts-store";

export async function retrievePublicMemory(prisma: PrismaClient, args: { userId: string; problemId?: string; query?: string; profile: PublicRetrievalProfile }) {
  const [facts, episodes] = await Promise.all([
    prisma.l2MemoryFact.findMany({ where: { userId: args.userId, status: "active", ...(args.problemId ? { OR: [{ problemId: args.problemId }, { problemId: null }] } : {}) }, orderBy: { lastSeenAt: "desc" }, take: args.profile.factLimit }),
    prisma.memoryEpisode.findMany({ where: { userId: args.userId, ...(args.problemId ? { problemId: args.problemId } : {}) }, orderBy: { createdAt: "desc" }, take: args.profile.episodeLimit }),
  ]);
  const ftsHits = args.query && args.profile.ftsLimit > 0 ? getDefaultFtsStore().searchMemoryFts(args.query, { limit: args.profile.ftsLimit }) : [];
  const [matchedFacts, matchedEpisodes, matchedNotes] = await Promise.all([
    prisma.l2MemoryFact.findMany({
      where: { userId: args.userId, status: "active", id: { in: idsFor(ftsHits, "fact") } },
      select: { id: true, factType: true, tag: true, label: true, value: true },
    }),
    prisma.memoryEpisode.findMany({
      where: { userId: args.userId, id: { in: idsFor(ftsHits, "episode") } },
      select: { id: true, kind: true, title: true, summary: true, outcome: true },
    }),
    prisma.knowledgeNote.findMany({
      where: { userId: args.userId, status: "active", id: { in: idsFor(ftsHits, "knowledge_note") } },
      select: { id: true, title: true, snippet: true, whenToUse: true, category: true },
    }),
  ]);
  const documents = new Map<string, unknown>([
    ...matchedFacts.map((fact) => [fact.id, { documentKind: "fact", ...fact }] as const),
    ...matchedEpisodes.map((episode) => [episode.id, {
      documentKind: "episode",
      id: episode.id,
      episodeKind: episode.kind,
      title: episode.title,
      summary: episode.summary,
      outcome: episode.outcome,
    }] as const),
    ...matchedNotes.map((note) => [note.id, { documentKind: "knowledge_note", ...note }] as const),
  ]);
  return {
    facts,
    episodes,
    ftsHits: ftsHits.map((hit) => ({ ...hit, document: documents.get(hit.refId) ?? null })),
  };
}

function idsFor(
  hits: Array<{ refId: string; kind: string }>,
  kind: string,
) {
  return hits.filter((hit) => hit.kind === kind).map(({ refId }) => refId);
}
