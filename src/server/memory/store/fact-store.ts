import type { PrismaClient } from "@prisma/client";

export type FactSource = "local_review" | "user_explicit";
export async function arbitrateFactCandidates(prisma: PrismaClient, args: { userId: string; problemId?: string; source: FactSource; candidates: Array<{ factType: string; tag: string; value?: string; observedBehavior?: string; evidenceTraceIds?: string[] }> }) {
  const updated = [];
  const rejected: Array<{ candidate: unknown; reason: string }> = [];
  for (const candidate of args.candidates) {
    if (!candidate.factType || !candidate.tag) { rejected.push({ candidate, reason: "Missing type or tag" }); continue; }
    const existing = await prisma.l2MemoryFact.findUnique({
      where: { userId_factType_tag: { userId: args.userId, factType: candidate.factType, tag: candidate.tag } },
      select: { evidenceCount: true },
    });
    const nextEvidenceCount = (existing?.evidenceCount ?? 0) + 1;
    const confidence = Math.min(0.85, 0.5 + Math.max(0, nextEvidenceCount - 1) * 0.05);
    updated.push(await prisma.l2MemoryFact.upsert({
      where: { userId_factType_tag: { userId: args.userId, factType: candidate.factType, tag: candidate.tag } },
      update: { value: candidate.value, confidence, evidenceCount: nextEvidenceCount, lastEvidenceSummary: candidate.observedBehavior, lastSeenAt: new Date(), source: args.source },
      create: { userId: args.userId, problemId: args.problemId, factType: candidate.factType, tag: candidate.tag, value: candidate.value, confidence, lastEvidenceSummary: candidate.observedBehavior, evidenceTraceIds: JSON.stringify(candidate.evidenceTraceIds ?? []), source: args.source },
    }));
  }
  return { updated, rejected };
}
export function mapMemoryUpdateCandidateToFactCandidates() { return []; }
export async function upsertStrategyCandidate() { return null; }
