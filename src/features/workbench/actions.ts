import "server-only";

import { publicHot150Bank } from "@/data/hot150/local-bank.public";
import { localUserHandle } from "@/features/onboarding/profile-defaults";
import prisma from "@/server/db/prisma";

async function ids(problemSlug: string) {
  const [user, problem] = await Promise.all([
    prisma.user.upsert({ where: { handle: localUserHandle }, update: {}, create: { handle: localUserHandle } }),
    prisma.problem.findUniqueOrThrow({ where: { slug: problemSlug } }),
  ]);
  return { userId: user.id, problemId: problem.id };
}
export async function saveDraftState(input: { problemSlug: string; content: string; selectedTestCaseIds: string[] }) {
  const { userId, problemId } = await ids(input.problemSlug);
  await prisma.codeDraft.upsert({ where: { userId_problemId_language: { userId, problemId, language: "Python" } }, update: { content: input.content, selectedTestCaseIds: JSON.stringify(input.selectedTestCaseIds) }, create: { userId, problemId, language: "Python", content: input.content, selectedTestCaseIds: JSON.stringify(input.selectedTestCaseIds) } });
  return { ok: true as const };
}
export async function createCustomTestCase(input: { problemSlug: string; label: string; input: Record<string, unknown>; expected: unknown }) {
  const { userId, problemId } = await ids(input.problemSlug);
  const row = await prisma.problemTestCase.create({ data: { userId, problemId, label: input.label || "Custom visible test", inputJson: JSON.stringify(input.input), expectedJson: JSON.stringify(input.expected), source: "custom", isVisible: true } });
  return { ok: true as const, testCase: { id: row.id, label: row.label, input: input.input, expected: input.expected, source: "custom" as const } };
}
export async function loadWorkbenchProblemBySlug(slug: string) {
  const problem = publicHot150Bank.problems.find((entry) => entry.slug === slug);
  if (!problem) throw new Error("Unknown Hot-150 problem.");
  return { ok: true as const, problem };
}
