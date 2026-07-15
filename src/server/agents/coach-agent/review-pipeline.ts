import prisma from "@/server/db/prisma";
import { completePublicCoach } from "@/server/llm/client";
import { sanitizeToolProtocolText } from "@/server/llm/tool-protocol-leak";
import { arbitrateFactCandidates } from "@/server/memory/store/fact-store";
import { getDefaultFtsStore } from "@/server/memory/store/fts-store";
import { executePracticeRun, type PracticeRunRequest } from "@/server/workbench/practice-run";
import { buildPublicReviewPrompt } from "./build-coach-prompt";
import { applyCoachReplyGuards } from "./coach-reply-contract";
import { localCoachReview } from "./local-coach-provider";

export async function reviewPipeline(input: PracticeRunRequest) {
  const run = await executePracticeRun(input);
  if (run.runResult.evidenceKind !== "executed" || !run.persisted || !run.user || !run.problemRow || !run.draft) {
    return {
      persisted: false,
      runResult: run.runResult,
      coachReply: "Review requires real local Piston evidence. Start Piston, refresh the Workbench, and run the selected visible tests again.",
    };
  }

  const [recentEpisodes, focusedFacts, profile] = await Promise.all([
    prisma.memoryEpisode.findMany({
      where: { userId: run.user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { summary: true },
    }),
    prisma.l2MemoryFact.findMany({
      where: { userId: run.user.id, status: "active" },
      orderBy: { lastSeenAt: "desc" },
      take: 6,
      select: { factType: true, tag: true, value: true },
    }),
    prisma.userProfile.findUnique({
      where: { userId: run.user.id },
      select: {
        strongPatterns: true,
        weakPatterns: true,
        outputPreferences: true,
        explanationStyle: true,
      },
    }),
  ]);
  const prompt = buildPublicReviewPrompt({
    problem: run.problem,
    code: input.code,
    runResult: run.runResult,
    memorySummary: [
      profile
        ? `Profile: strong=${profile.strongPatterns}; weak=${profile.weakPatterns}; output=${profile.outputPreferences}; style=${profile.explanationStyle}`
        : "",
      focusedFacts
        .map(({ factType, tag, value }) => `${factType}:${tag}:${value ?? ""}`)
        .join(" | "),
      recentEpisodes.map(({ summary }) => summary).join(" | "),
    ]
      .filter(Boolean)
      .join("\n"),
  });
  const externalCoachReply = await completePublicCoach([
    { role: "user", content: prompt },
  ]);
  const rawCoachReply =
    externalCoachReply ?? localCoachReview(run.problem.title, run.runResult);
  const protocolSafeReply = sanitizeToolProtocolText(rawCoachReply).text;
  const coachReply = applyCoachReplyGuards(protocolSafeReply, {
    responseLanguage: "en",
    runStatus: run.runResult.status,
  }).reply;
  const coachProvider = externalCoachReply ? "external" : "local";
  const issueSummary = summarizeIssue(run.runResult);
  const passed = run.runResult.status === "passed_visible_tests";

  const persisted = await prisma.$transaction(async (tx) => {
    const session = await tx.chatSession.upsert({
      where: { userId_problemId: { userId: run.user.id, problemId: run.problemRow.id } },
      update: { isActive: true },
      create: {
        userId: run.user.id,
        problemId: run.problemRow.id,
        title: run.problem.title,
        primaryLanguage: "Python",
      },
    });
    const review = await tx.reviewAttempt.create({
      data: {
        userId: run.user.id,
        problemId: run.problemRow.id,
        chatSessionId: session.id,
        codeDraftId: run.draft.id,
        language: "Python",
        codeSnapshot: input.code,
        selectedTestCaseIds: JSON.stringify(input.testCases.map(({ id }) => id)),
        selectedTestsJson: JSON.stringify(input.testCases),
        coachReplyMarkdown: coachReply,
      },
    });
    await tx.runEvidence.create({
      data: {
        reviewAttemptId: review.id,
        chatSessionId: session.id,
        source: "review",
        evidenceKind: "executed",
        status: run.runResult.status,
        passedCount: run.runResult.passedCount,
        failedCount: run.runResult.failedCount,
        durationMs: run.runResult.durationMs,
        stdout: run.runResult.stdout,
        stderr: run.runResult.stderr,
        firstFailedCaseJson: run.runResult.firstFailedCase ? JSON.stringify(run.runResult.firstFailedCase) : null,
        rawResultJson: JSON.stringify(run.runResult),
      },
    });
    await tx.diagnosisResult.create({
      data: {
        reviewAttemptId: review.id,
        diagnosisJson: JSON.stringify({ status: run.runResult.status, source: "public_visible_tests" }),
        mistakeTags: JSON.stringify(passed ? [] : run.problem.tags),
        skillTags: JSON.stringify(passed ? run.problem.tags : []),
        userIssueSummary: issueSummary,
        coachSummary: coachReply.slice(0, 400),
      },
    });
    const history = await tx.problemHistory.create({
      data: {
        userId: run.user.id,
        problemId: run.problemRow.id,
        reviewAttemptId: review.id,
        chatSessionId: session.id,
        language: "Python",
        problemTags: JSON.stringify(run.problem.tags),
        runStatus: run.runResult.status,
        failedCaseSummary: run.runResult.firstFailedCase
          ? JSON.stringify(run.runResult.firstFailedCase)
          : null,
        userIssueSummary: issueSummary,
        coachSummary: coachReply.slice(0, 400),
        memoryUpdateSummary: passed
          ? `Reinforced ${run.problem.tags.join(", ")}`
          : `Recorded visible-test difficulty for ${run.problem.tags.join(", ")}`,
        nextRecommendation: run.runResult.status === "passed_visible_tests" ? "Add a boundary custom test." : "Trace the first failing visible test.",
        durationSeconds: input.durationSeconds,
      },
    });
    const episode = await tx.memoryEpisode.create({
      data: {
        userId: run.user.id,
        problemId: run.problemRow.id,
        chatSessionId: session.id,
        kind: "review",
        title: `${run.problem.number}. ${run.problem.title}`,
        summary: `${run.runResult.passedCount}/${run.runResult.totalCount} public visible tests; ${run.runResult.status}.`,
        outcome: run.runResult.status,
        tags: JSON.stringify(run.problem.tags),
        sourceTraceIds: "[]",
      },
    });
    const sequence = await tx.chatMessage.count({ where: { sessionId: session.id } });
    await tx.chatMessage.create({
      data: { sessionId: session.id, reviewAttemptId: review.id, role: "assistant", contentMarkdown: coachReply, sequence: sequence + 1 },
    });
    await tx.l1MemoryEvent.createMany({
      data: [
        {
          userId: run.user.id,
          problemId: run.problemRow.id,
          chatSessionId: session.id,
          reviewAttemptId: review.id,
          eventType: "review_attempt",
          eventJson: JSON.stringify({
            language: "Python",
            selectedTestCount: input.testCases.length,
          }),
          source: "public_review",
        },
        {
          userId: run.user.id,
          problemId: run.problemRow.id,
          chatSessionId: session.id,
          reviewAttemptId: review.id,
          eventType: "run_evidence",
          eventJson: JSON.stringify({
            evidenceKind: run.runResult.evidenceKind,
            status: run.runResult.status,
            passedCount: run.runResult.passedCount,
            totalCount: run.runResult.totalCount,
          }),
          source: "public_review",
        },
        {
          userId: run.user.id,
          problemId: run.problemRow.id,
          chatSessionId: session.id,
          reviewAttemptId: review.id,
          eventType: "coach_reply",
          eventJson: JSON.stringify({ coachProvider }),
          content: coachReply,
          source: "public_review",
        },
      ],
    });
    return {
      reviewAttemptId: review.id,
      problemHistoryId: history.id,
      episode,
    };
  });
  const facts = await arbitrateFactCandidates(prisma, {
    userId: run.user.id,
    problemId: run.problemRow.id,
    source: "local_review",
    candidates: run.problem.tags.map((tag) => ({
      factType: passed ? "skill" : "mistake",
      tag: normalizeTag(tag),
      value: passed
        ? `Passed the selected visible tests for ${run.problem.title}.`
        : issueSummary ?? `Needs another review on ${run.problem.title}.`,
      observedBehavior: `${run.runResult.status}: ${run.runResult.passedCount}/${run.runResult.totalCount} selected visible tests passed.`,
    })),
  });
  const fts = getDefaultFtsStore();
  fts.indexMemoryDocument({
    kind: "episode",
    refId: persisted.episode.id,
    content: `${persisted.episode.title}\n${persisted.episode.summary}`,
  });
  for (const fact of facts.updated) {
    fts.indexMemoryDocument({
      kind: "fact",
      refId: fact.id,
      content: `${fact.tag}\n${fact.label ?? ""}\n${fact.value ?? ""}`,
    });
  }
  return {
    persisted: true,
    runResult: run.runResult,
    coachReply,
    coachProvider,
    ...persisted,
  };
}

function summarizeIssue(result: {
  stderr: string;
  firstFailedCase?: { error?: string; expected?: unknown; actual?: unknown };
}) {
  if (result.firstFailedCase?.error) return result.firstFailedCase.error;
  if (result.stderr.trim()) return result.stderr.trim().slice(0, 500);
  if (result.firstFailedCase) {
    return `Expected ${JSON.stringify(result.firstFailedCase.expected)}, received ${JSON.stringify(result.firstFailedCase.actual)}.`;
  }
  return null;
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
