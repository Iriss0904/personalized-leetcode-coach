import type { PrismaClient } from "@prisma/client";
import { normalizeMemoryTag } from "@/server/memory/memory.types";
import {
  addPlannerDays,
  startOfPlannerDay,
} from "@/server/planner/planner-rules";
import {
  nonNoiseMistakeTags,
  resolvedReviewProblemCardFromInput,
  reviewProblemCardFromInput,
  sortReviewProblemCards,
  sortTodayReviewFocusCards,
  TODAY_REVIEW_CARD_CAP,
} from "./priority";
import type {
  ResolvedReviewProblemInput,
  ReviewFocusBoard,
  ReviewProblemInput,
  ReviewProblemLibrary,
} from "./review-focus.types";

const HISTORY_TAKE = 400;
const ACTIVE_WEAKNESS_STATUSES = ["active", "improving"];

type JsonProblemHistory = Awaited<
  ReturnType<typeof loadProblemHistoryRows>
>[number];

function parseTags(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

function latestByProblem<T extends { problemId: string; createdAt: Date }>(
  rows: T[],
) {
  const byProblem = new Map<string, T>();
  for (const row of rows) {
    if (!byProblem.has(row.problemId)) {
      byProblem.set(row.problemId, row);
    }
  }
  return byProblem;
}

function diagnosisFromRow(
  row: JsonProblemHistory,
): ReviewProblemInput["diagnosis"] {
  const diagnosis = row.reviewAttempt.diagnosisResult;
  if (!diagnosis) {
    return null;
  }

  return {
    mistakeTags: parseTags(diagnosis.mistakeTags),
    userIssueSummary: diagnosis.userIssueSummary,
    coachSummary: diagnosis.coachSummary,
    selfCheckQuestion: diagnosis.selfCheckQuestion,
    selfCheckAnswer: diagnosis.selfCheckAnswer,
  };
}

function latestRunStatus(row: JsonProblemHistory) {
  return row.reviewAttempt.runEvidences[0]?.status ?? row.runStatus;
}

function toInput(args: {
  row: JsonProblemHistory;
  latestOutcome: { selfRating: string | null } | undefined;
  dueDate: Date | null;
  planItemId: string | null;
  recurringWeaknessTags: string[];
}): ReviewProblemInput {
  return {
    problemId: args.row.problemId,
    slug: args.row.problem.slug,
    title: args.row.problem.title,
    difficulty: args.row.problem.difficulty,
    leetcodeNumber: args.row.problem.leetcodeNumber,
    planItemId: args.planItemId,
    latestRunStatus: latestRunStatus(args.row),
    latestSelfRating: args.latestOutcome?.selfRating ?? null,
    lastAttemptAt: args.row.createdAt,
    dueDate: args.dueDate,
    problemTags: parseTags(args.row.problem.tags),
    diagnosis: diagnosisFromRow(args.row),
    recurringWeaknessTags: args.recurringWeaknessTags,
  };
}

function findLatestResolvedTrap(
  rows: JsonProblemHistory[],
  latestRow: JsonProblemHistory,
) {
  for (const row of rows) {
    if (row.id === latestRow.id) {
      continue;
    }

    const diagnosis = diagnosisFromRow(row);
    if (diagnosis && nonNoiseMistakeTags(diagnosis.mistakeTags).length > 0) {
      return diagnosis;
    }
  }

  return null;
}

function isPassedStatus(status: string | null | undefined) {
  const value = status?.trim().toLowerCase();
  return (
    value === "passed" ||
    value === "passed_visible_tests" ||
    value === "accepted" ||
    value === "ac" ||
    value === "all_passed"
  );
}

function resolvedInputFor(args: {
  latestInput: ReviewProblemInput;
  latestRow: JsonProblemHistory;
  rows: JsonProblemHistory[];
}): ResolvedReviewProblemInput | null {
  if (!isPassedStatus(args.latestInput.latestRunStatus)) {
    return null;
  }

  const latestTags = args.latestInput.diagnosis
    ? nonNoiseMistakeTags(args.latestInput.diagnosis.mistakeTags)
    : [];
  if (latestTags.length > 0) {
    return null;
  }

  const resolvedTrapDiagnosis = findLatestResolvedTrap(args.rows, args.latestRow);
  if (!resolvedTrapDiagnosis) {
    return null;
  }

  return {
    ...args.latestInput,
    resolvedTrapDiagnosis,
  };
}

async function loadProblemHistoryRows(db: PrismaClient, userId: string) {
  return db.problemHistory.findMany({
    where: { userId },
    include: {
      problem: true,
      reviewAttempt: {
        include: {
          diagnosisResult: true,
          runEvidences: {
            where: { source: "review" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: HISTORY_TAKE,
  });
}

async function loadRecurringWeaknessTags(db: PrismaClient, userId: string) {
  const facts = await db.l2MemoryFact.findMany({
    where: {
      userId,
      factType: "mistake",
      status: { in: ACTIVE_WEAKNESS_STATUSES },
      evidenceCount: { gte: 2 },
    },
    select: { tag: true },
  });

  return facts
    .map((fact) => normalizeMemoryTag(fact.tag))
    .filter((tag) => nonNoiseMistakeTags([tag]).length > 0);
}

async function loadDueDates(
  db: PrismaClient,
  args: { userId: string; goalId: string | null; now: Date },
) {
  if (!args.goalId) {
    return new Map<string, Date>();
  }

  const today = startOfPlannerDay(args.now);
  const tomorrow = addPlannerDays(today, 1);
  const schedules = await db.reviewSchedule.findMany({
    where: {
      userId: args.userId,
      goalId: args.goalId,
      status: "active",
      dueDate: { lt: tomorrow },
    },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
  });

  return new Map(schedules.map((schedule) => [schedule.problemId, schedule.dueDate]));
}

async function loadLatestOutcomeMap(db: PrismaClient, userId: string) {
  const outcomes = await db.plannerOutcome.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    select: { problemId: true, selfRating: true, createdAt: true },
  });

  return latestByProblem(outcomes);
}

async function loadPlanItemMap(
  db: PrismaClient,
  args: { userId: string; goalId: string | null },
) {
  if (!args.goalId) {
    return new Map<string, { id: string }>();
  }

  const planItems = await db.plannerPlanItem.findMany({
    where: {
      userId: args.userId,
      goalId: args.goalId,
      status: { not: "replaced" },
    },
    orderBy: { sortOrder: "asc" },
    select: { problemId: true, id: true },
  });

  return new Map(planItems.map((item) => [item.problemId, { id: item.id }]));
}

function groupHistoriesByProblem(rows: JsonProblemHistory[]) {
  const grouped = new Map<string, JsonProblemHistory[]>();
  for (const row of rows) {
    const group = grouped.get(row.problemId) ?? [];
    group.push(row);
    grouped.set(row.problemId, group);
  }
  return grouped;
}

export async function loadReviewProblemLibrary(
  db: PrismaClient,
  args: { userId: string; goalId?: string | null; now: Date },
): Promise<ReviewProblemLibrary> {
  const [historyRows, recurringWeaknessTags, dueDates, latestOutcomes, planItems] =
    await Promise.all([
      loadProblemHistoryRows(db, args.userId),
      loadRecurringWeaknessTags(db, args.userId),
      loadDueDates(db, {
        userId: args.userId,
        goalId: args.goalId ?? null,
        now: args.now,
      }),
      loadLatestOutcomeMap(db, args.userId),
      loadPlanItemMap(db, {
        userId: args.userId,
        goalId: args.goalId ?? null,
      }),
    ]);

  const grouped = groupHistoriesByProblem(historyRows);
  const latestRows = [...grouped.values()].flatMap((rows) =>
    rows[0] ? [rows[0]] : [],
  );
  const inputs = latestRows.map((row) =>
    toInput({
      row,
      latestOutcome: latestOutcomes.get(row.problemId),
      dueDate: dueDates.get(row.problemId) ?? null,
      planItemId: planItems.get(row.problemId)?.id ?? null,
      recurringWeaknessTags,
    }),
  );

  const cardsWithMeta = inputs
    .map((input) => reviewProblemCardFromInput(input, args.now))
    .filter(
      (
        card,
      ): card is NonNullable<ReturnType<typeof reviewProblemCardFromInput>> =>
        Boolean(card),
    );

  const resolvedCardsWithMeta = latestRows
    .map((row) => {
      const input = inputs.find((candidate) => candidate.problemId === row.problemId);
      if (!input) {
        return null;
      }

      const resolvedInput = resolvedInputFor({
        latestInput: input,
        latestRow: row,
        rows: grouped.get(row.problemId) ?? [],
      });
      return resolvedInput
        ? resolvedReviewProblemCardFromInput(resolvedInput, args.now)
        : null;
    })
    .filter(
      (
        card,
      ): card is NonNullable<
        ReturnType<typeof resolvedReviewProblemCardFromInput>
      > => Boolean(card),
    );

  return {
    cards: sortReviewProblemCards(cardsWithMeta),
    resolvedCards: sortReviewProblemCards(resolvedCardsWithMeta),
  };
}

export async function buildReviewFocusBoard(
  db: PrismaClient,
  args: { userId: string; goalId: string; now: Date },
): Promise<ReviewFocusBoard> {
  const library = await loadReviewProblemLibrary(db, args);

  return { cards: selectTodayReviewFocusCards(library) };
}

export function selectTodayReviewFocusCards(
  library: ReviewProblemLibrary,
  cap = TODAY_REVIEW_CARD_CAP,
) {
  const byProblem = new Map(
    library.resolvedCards.map((card) => [card.problemId, card]),
  );
  for (const card of library.cards) {
    byProblem.set(card.problemId, card);
  }
  return sortTodayReviewFocusCards([...byProblem.values()]).slice(0, cap);
}
