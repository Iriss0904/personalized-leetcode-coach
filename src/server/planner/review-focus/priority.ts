import { normalizeMemoryTag } from "@/server/memory/memory.types";
import { isGenuineDiagnosisForSelfCheck } from "@/server/agents/coach-agent/self-check-eligibility";
import {
  daysBetweenPlannerDates,
  plannerDisplayTags,
  toPlannerDateInput,
} from "@/server/planner/planner-rules";
import type {
  ResolvedReviewProblemInput,
  ReviewFocusBoard,
  ReviewProblemCard,
  ReviewProblemInput,
  ReviewProblemOutcome,
} from "./review-focus.types";

export const DAY_MS = 24 * 60 * 60 * 1000;
export const TODAY_REVIEW_CARD_CAP = 3;
export const OVERDUE_HORIZON_DAYS = 7;
export const DUE_TODAY_BONUS = 0.2;
export const RECENCY_HORIZON_DAYS = 30;
export const TRAP_SUMMARY_MAX_CHARS = 96;

export const REVIEW_NOISE_TAGS = new Set([
  "no_search_logic",
  "hardcoded_return",
  "syntax_error",
  "indentation_error",
  "missing_return",
  "missing_pass_in_init",
  "initialization_error",
]);

export const REVIEW_PROBLEM_PRIORITY_WEIGHTS = {
  outcome: 0.4,
  due: 0.25,
  recurringWeakness: 0.2,
  recency: 0.15,
} as const;

const OUTCOME_SCORE: Record<ReviewProblemOutcome, number> = {
  unsolved: 1,
  failed: 0.85,
  struggled: 0.7,
  hesitated: 0.5,
  passed: 0.1,
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

export function isNoiseReviewTag(tag: string) {
  return REVIEW_NOISE_TAGS.has(normalizeMemoryTag(tag));
}

export function nonNoiseMistakeTags(tags: string[]) {
  return [...new Set(tags.map(normalizeMemoryTag).filter(Boolean))].filter(
    (tag) => !isNoiseReviewTag(tag),
  );
}

export function collapseOneLine(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

export function truncateSummary(value: string, maxChars = TRAP_SUMMARY_MAX_CHARS) {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

export function trapSummaryFromDiagnosis(
  diagnosis: ReviewProblemInput["diagnosis"],
) {
  const tags = diagnosis ? nonNoiseMistakeTags(diagnosis.mistakeTags) : [];
  if (!diagnosis || tags.length === 0) {
    return null;
  }

  const summary = collapseOneLine(diagnosis.userIssueSummary);
  return truncateSummary(summary || tags[0].replace(/_/g, " "));
}

export function lastOutcomeFor(args: {
  latestSelfRating?: string | null;
  latestRunStatus?: string | null;
}): ReviewProblemOutcome | null {
  const status = args.latestRunStatus?.trim().toLowerCase();
  const isPassed =
    status === "passed" ||
    status === "passed_visible_tests" ||
    status === "accepted" ||
    status === "ac" ||
    status === "all_passed";

  if (isPassed && args.latestSelfRating === "unsolved") {
    return "unsolved";
  }

  if (isPassed && args.latestSelfRating === "struggled") {
    return "struggled";
  }

  if (isPassed && args.latestSelfRating === "hesitated") {
    return "hesitated";
  }

  if (!status) {
    return null;
  }

  if (isPassed) {
    return "passed";
  }

  if (
    status === "failed" ||
    status === "wrong_answer" ||
    status === "runtime_error" ||
    status === "compile_error" ||
    status === "syntax_error" ||
    status === "timeout" ||
    status === "time_limit_exceeded"
  ) {
    return "failed";
  }

  return null;
}

export function dueScore(dueDate: Date | null | undefined, now: Date) {
  if (!dueDate) {
    return 0;
  }

  const overdueDays = daysBetweenPlannerDates(dueDate, now);
  const base = clamp(overdueDays / OVERDUE_HORIZON_DAYS);
  return Math.min(1, base + (overdueDays === 0 ? DUE_TODAY_BONUS : 0));
}

export function recencyScore(lastAttemptAt: Date, now: Date) {
  const deltaDays = Math.max(0, now.getTime() - lastAttemptAt.getTime()) / DAY_MS;
  return clamp(1 - deltaDays / RECENCY_HORIZON_DAYS);
}

export function recurringWeaknessScore(args: {
  mistakeTags: string[];
  recurringWeaknessTags: string[];
}) {
  const recurring = new Set(args.recurringWeaknessTags.map(normalizeMemoryTag));
  return args.mistakeTags.some((tag) => recurring.has(tag)) ? 1 : 0;
}

export function problemReviewPriority(args: {
  lastOutcome: ReviewProblemOutcome | null;
  dueDate?: Date | null;
  nonNoiseTags: string[];
  recurringWeaknessTags: string[];
  lastAttemptAt: Date;
  now: Date;
}) {
  const w = REVIEW_PROBLEM_PRIORITY_WEIGHTS;
  return (
    w.outcome * (args.lastOutcome ? OUTCOME_SCORE[args.lastOutcome] : 0) +
    w.due * dueScore(args.dueDate, args.now) +
    w.recurringWeakness *
      recurringWeaknessScore({
        mistakeTags: args.nonNoiseTags,
        recurringWeaknessTags: args.recurringWeaknessTags,
      }) +
    w.recency * recencyScore(args.lastAttemptAt, args.now)
  );
}

function primaryPatternTag(tags: string[]) {
  return plannerDisplayTags(tags)[0] ?? null;
}

function flashcardFor(diagnosis: ReviewProblemInput["diagnosis"]) {
  const question = collapseOneLine(diagnosis?.selfCheckQuestion);
  const answer = diagnosis?.selfCheckAnswer?.trim() ?? "";
  return question && answer ? { question, answer } : null;
}

function flashcardStateFor(
  diagnosis: ReviewProblemInput["diagnosis"],
  runStatus?: string | null,
) {
  const flashcard = flashcardFor(diagnosis);
  if (flashcard) {
    return { status: "available" as const, flashcard };
  }

  return {
    status: isGenuineDiagnosisForSelfCheck(
      diagnosis ? { ...diagnosis, runStatus } : null,
    )
      ? ("can_generate" as const)
      : ("diagnosis_unavailable" as const),
    flashcard: null,
  };
}

export function reviewProblemCardFromInput(
  input: ReviewProblemInput,
  now: Date,
): (ReviewProblemCard & { sortMeta: { dueDate: Date | null; lastAttemptAt: Date } }) | null {
  const nonNoiseTags = input.diagnosis
    ? nonNoiseMistakeTags(input.diagnosis.mistakeTags)
    : [];
  const trapSummary = trapSummaryFromDiagnosis(input.diagnosis);

  if (!trapSummary || nonNoiseTags.length === 0) {
    return null;
  }

  const lastOutcome = lastOutcomeFor({
    latestSelfRating: input.latestSelfRating,
    latestRunStatus: input.latestRunStatus,
  });
  const flashcardState = flashcardStateFor(input.diagnosis, input.latestRunStatus);

  return {
    problemId: input.problemId,
    slug: input.slug,
    title: input.title,
    difficulty: input.difficulty,
    leetcodeNumber: input.leetcodeNumber,
    planItemId: input.planItemId ?? null,
    lastOutcome,
    trapSummary,
    dueDate: input.dueDate ? toPlannerDateInput(input.dueDate) : null,
    priority: problemReviewPriority({
      lastOutcome,
      dueDate: input.dueDate,
      nonNoiseTags,
      recurringWeaknessTags: input.recurringWeaknessTags,
      lastAttemptAt: input.lastAttemptAt,
      now,
    }),
    primaryPatternTag: primaryPatternTag(input.problemTags),
    hasFlashcard: Boolean(flashcardState.flashcard),
    flashcardStatus: flashcardState.status,
    flashcard: flashcardState.flashcard,
    sortMeta: {
      dueDate: input.dueDate ?? null,
      lastAttemptAt: input.lastAttemptAt,
    },
  };
}

export function resolvedReviewProblemCardFromInput(
  input: ResolvedReviewProblemInput,
  now: Date,
): (ReviewProblemCard & { sortMeta: { dueDate: Date | null; lastAttemptAt: Date } }) | null {
  const trapSummary = trapSummaryFromDiagnosis(input.resolvedTrapDiagnosis);
  const flashcardState = flashcardStateFor(input.resolvedTrapDiagnosis);
  const lastOutcome =
    lastOutcomeFor({
      latestSelfRating: input.latestSelfRating,
      latestRunStatus: input.latestRunStatus,
    }) ?? "passed";

  if (!trapSummary) {
    return null;
  }

  return {
    problemId: input.problemId,
    slug: input.slug,
    title: input.title,
    difficulty: input.difficulty,
    leetcodeNumber: input.leetcodeNumber,
    planItemId: input.planItemId ?? null,
    lastOutcome,
    trapSummary,
    dueDate: input.dueDate ? toPlannerDateInput(input.dueDate) : null,
    priority: problemReviewPriority({
      lastOutcome,
      dueDate: input.dueDate,
      nonNoiseTags: nonNoiseMistakeTags(input.resolvedTrapDiagnosis.mistakeTags),
      recurringWeaknessTags: input.recurringWeaknessTags,
      lastAttemptAt: input.lastAttemptAt,
      now,
    }),
    primaryPatternTag: primaryPatternTag(input.problemTags),
    hasFlashcard: Boolean(flashcardState.flashcard),
    flashcardStatus: flashcardState.status,
    flashcard: flashcardState.flashcard,
    sortMeta: {
      dueDate: input.dueDate ?? null,
      lastAttemptAt: input.lastAttemptAt,
    },
  };
}

function compareCards(
  a: ReviewProblemCard & { sortMeta: { dueDate: Date | null; lastAttemptAt: Date } },
  b: ReviewProblemCard & { sortMeta: { dueDate: Date | null; lastAttemptAt: Date } },
) {
  if (b.priority !== a.priority) {
    return b.priority - a.priority;
  }

  const aDue = a.sortMeta.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
  const bDue = b.sortMeta.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
  if (aDue !== bDue) {
    return aDue - bDue;
  }

  const attemptDelta =
    b.sortMeta.lastAttemptAt.getTime() - a.sortMeta.lastAttemptAt.getTime();
  if (attemptDelta !== 0) {
    return attemptDelta;
  }

  return a.slug.localeCompare(b.slug);
}

function stripSortMeta(
  card: ReviewProblemCard & {
    sortMeta: { dueDate: Date | null; lastAttemptAt: Date };
  },
): ReviewProblemCard {
  const { sortMeta, ...rest } = card;
  void sortMeta;
  return rest;
}

export function sortReviewProblemCards(
  cards: Array<
    ReviewProblemCard & { sortMeta: { dueDate: Date | null; lastAttemptAt: Date } }
  >,
) {
  return [...cards].sort(compareCards).map(stripSortMeta);
}

const TODAY_FOCUS_OUTCOME_RANK: Record<ReviewProblemOutcome, number> = {
  unsolved: 4,
  struggled: 3,
  hesitated: 2,
  failed: 1,
  passed: 0,
};

function todayFocusOutcomeRank(outcome: ReviewProblemOutcome | null) {
  return outcome ? TODAY_FOCUS_OUTCOME_RANK[outcome] : -1;
}

export function sortTodayReviewFocusCards(cards: ReviewProblemCard[]) {
  return [...cards].sort((a, b) => {
    const outcomeDelta =
      todayFocusOutcomeRank(b.lastOutcome) - todayFocusOutcomeRank(a.lastOutcome);
    if (outcomeDelta !== 0) {
      return outcomeDelta;
    }

    const aDue = a.dueDate ?? "";
    const bDue = b.dueDate ?? "";
    if (aDue || bDue) {
      if (!aDue) return 1;
      if (!bDue) return -1;
      if (aDue !== bDue) return aDue.localeCompare(bDue);
    }

    if (a.hasFlashcard !== b.hasFlashcard) {
      return a.hasFlashcard ? -1 : 1;
    }

    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }

    return a.slug.localeCompare(b.slug);
  });
}

export function buildReviewFocusBoardFromInputs(args: {
  problems: ReviewProblemInput[];
  now: Date;
  cap?: number;
}): ReviewFocusBoard {
  const cards = args.problems
    .map((problem) => reviewProblemCardFromInput(problem, args.now))
    .filter(
      (
        card,
      ): card is ReviewProblemCard & {
        sortMeta: { dueDate: Date | null; lastAttemptAt: Date };
      } => Boolean(card),
    );

  return {
    cards: sortReviewProblemCards(cards).slice(0, args.cap ?? TODAY_REVIEW_CARD_CAP),
  };
}
