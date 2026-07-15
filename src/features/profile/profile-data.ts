import { localUserHandle, publicDefaultProfile } from "@/features/onboarding/profile-defaults";
import prisma from "@/server/db/prisma";
import type { SkillStatus } from "@/lib/ui-status";

export type ProfileSkillRow = { name: string; confidence: number | null; status: SkillStatus; source: string; evidenceCount: number };
function parseList(value: string | null | undefined, fallback: string[]) {
  try { const parsed = JSON.parse(value ?? "[]"); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : fallback; } catch { return fallback; }
}
export async function getProfilePageData() {
  const user = await prisma.user.upsert({ where: { handle: localUserHandle }, update: {}, create: { handle: localUserHandle } });
  const [profile, facts, history] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    prisma.l2MemoryFact.findMany({ where: { userId: user.id, status: "active" }, include: { problem: true }, orderBy: { lastSeenAt: "desc" } }),
    prisma.problemHistory.findFirst({ where: { userId: user.id }, include: { problem: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const skills = facts.filter(({ factType }) => factType === "skill").map((fact): ProfileSkillRow => ({ name: fact.label ?? fact.tag, confidence: fact.confidence, status: fact.confidence >= 0.75 ? "Strong" : fact.confidence >= 0.45 ? "Learning" : "Watch", source: fact.source, evidenceCount: fact.evidenceCount }));
  const mistakes = facts.filter(({ factType }) => factType === "mistake").map((fact) => ({ tag: fact.tag, label: fact.label ?? fact.tag, confidence: fact.confidence, evidenceCount: fact.evidenceCount, lastEvidenceSummary: fact.lastEvidenceSummary, lastSeenAt: fact.lastSeenAt, problemTitle: fact.problem?.title ?? null }));
  const latestSynthesis = buildDeterministicSynthesis(skills, mistakes);
  return {
    displayName: profile?.displayName ?? publicDefaultProfile.displayName,
    latestSynthesis,
    recentlyUpdatedFrom: history ? { problemTitle: history.problem.title, createdAt: history.createdAt } : null,
    skillProfile: skills,
    commonMistakes: mistakes,
    preferredLanguages: ["Python"],
    strongPatterns: parseList(profile?.strongPatterns, publicDefaultProfile.strongPatterns),
    weakPatterns: parseList(profile?.weakPatterns, publicDefaultProfile.weakPatterns),
    outputPreferences: parseList(profile?.outputPreferences, publicDefaultProfile.outputPreferences),
  };
}

function buildDeterministicSynthesis(
  skills: ProfileSkillRow[],
  mistakes: Array<{ label: string; evidenceCount: number }>,
) {
  if (skills.length === 0 && mistakes.length === 0) return null;
  const strongest = [...skills].sort((left, right) => (right.confidence ?? 0) - (left.confidence ?? 0)).slice(0, 3).map(({ name }) => name);
  const recurring = [...mistakes].sort((left, right) => right.evidenceCount - left.evidenceCount).slice(0, 3).map(({ label }) => label);
  return [
    strongest.length ? `Recent real Reviews show growing evidence in ${strongest.join(", ")}.` : "",
    recurring.length ? `Keep watching ${recurring.join(", ")} in the next attempt.` : "",
  ].filter(Boolean).join(" ");
}
