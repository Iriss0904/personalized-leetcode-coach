import { z } from "zod";
import { publicHot150Bank } from "@/data/hot150/local-bank.public";
import { findPublicHot150Problem } from "@/data/hot150/local-run-types";
import { localUserHandle } from "@/features/onboarding/profile-defaults";
import { hashCodeForRun, fingerprintCodeForExecution } from "@/server/code/code-hash";
import prisma from "@/server/db/prisma";
import { runCodeWithTests } from "@/server/tools/code-runner/run-code-with-tests";
import { codeRunTestCaseSchema } from "@/types/code-runner";

export const practiceRunRequestSchema = z.object({
  problemSlug: z.string().min(1),
  code: z.string(),
  language: z.literal("Python"),
  testCases: z.array(codeRunTestCaseSchema).min(1).max(20),
  durationSeconds: z.number().int().min(0).max(14_400).optional(),
});

export type PracticeRunRequest = z.infer<typeof practiceRunRequestSchema>;

export async function executePracticeRun(input: PracticeRunRequest) {
  const problem = findPublicHot150Problem(publicHot150Bank, input.problemSlug);
  if (!problem) throw new Error("Unknown Hot-150 problem.");

  const runResult = await runCodeWithTests({ ...input, problem });
  if (runResult.evidenceKind !== "executed") {
    return { persisted: false, problem, runResult };
  }

  const user = await prisma.user.upsert({
    where: { handle: localUserHandle },
    update: {},
    create: { handle: localUserHandle },
  });
  const problemRow = await prisma.problem.findUniqueOrThrow({ where: { slug: problem.slug } });
  const draft = await prisma.codeDraft.upsert({
    where: {
      userId_problemId_language: {
        userId: user.id,
        problemId: problemRow.id,
        language: "Python",
      },
    },
    update: { content: input.code, selectedTestCaseIds: JSON.stringify(input.testCases.map(({ id }) => id)) },
    create: {
      userId: user.id,
      problemId: problemRow.id,
      language: "Python",
      content: input.code,
      selectedTestCaseIds: JSON.stringify(input.testCases.map(({ id }) => id)),
    },
  });
  const runOrdinal = (await prisma.practiceRunLog.count({
    where: { userId: user.id, problemId: problemRow.id },
  })) + 1;
  await prisma.practiceRunLog.create({
    data: {
      userId: user.id,
      problemId: problemRow.id,
      codeDraftId: draft.id,
      language: "Python",
      codeHash: hashCodeForRun({ language: "Python", code: input.code }),
      executionFingerprint: fingerprintCodeForExecution({ language: "Python", code: input.code }),
      runOrdinal,
      selectedTestCaseIds: JSON.stringify(input.testCases.map(({ id }) => id)),
      status: runResult.status,
      passedCount: runResult.passedCount,
      totalCount: runResult.totalCount,
      summary: `${runResult.passedCount}/${runResult.totalCount} visible tests passed`,
      provider: "piston",
      rawResultJson: JSON.stringify(runResult),
      durationMs: runResult.durationMs,
    },
  });
  return { persisted: true, user, problem, problemRow, draft, runResult };
}
