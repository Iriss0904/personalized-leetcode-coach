import type { PrismaClient } from "@prisma/client";
import { runStatusKind } from "@/lib/ui-status";
import {
  addPlannerDays,
  startOfPlannerDay,
  toPlannerDateInput,
} from "@/server/planner/planner-rules";
import { classifyProblem } from "./hot150-categories";

export type GrowthAttempt = {
  id: string;
  problemId: string;
  problemTitle: string;
  createdAt: Date;
  runStatus: string;
  durationSeconds: number | null;
  difficulty: string | null;
  tags: string[];
};

export type GrowthProblem = {
  id: string;
  difficulty: string | null;
  hot150Order: number | null;
  tags: string[];
};

export type DailyActivityPoint = {
  date: string;
  problemCount: number;
  minutes: number;
};

export type AttemptsToFirstAcPoint = {
  problemId: string;
  problemTitle: string;
  firstAcDate: string;
  attemptsToAc: number;
};

export type CategoryProgress = {
  category: string;
  total: number;
  attempted: number;
  passed: number;
};

export type DifficultyMix = {
  Easy: number;
  Medium: number;
  Hard: number;
};

export type GrowthStats = {
  streakDays: number;
  weeklyProblemCount: number;
  solvedCount: number;
  top150Total: number;
  avgDurationSeconds: number | null;
  dailyActivity: DailyActivityPoint[];
  attemptsToFirstAc: AttemptsToFirstAcPoint[];
  categoryProgress: CategoryProgress[];
  difficultyMix: DifficultyMix;
};

const DEFAULT_ACTIVITY_DAYS = 30;

export async function loadGrowthStats(
  db: PrismaClient,
  userId: string,
  now: Date = new Date(),
): Promise<GrowthStats> {
  const [histories, problems] = await Promise.all([
    db.problemHistory.findMany({
      where: { userId },
      include: { problem: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    db.problem.findMany(),
  ]);
  const attempts = histories.map<GrowthAttempt>((history) => ({
    id: history.id,
    problemId: history.problemId,
    problemTitle: history.problem.title,
    createdAt: history.createdAt,
    runStatus: history.runStatus,
    durationSeconds: history.durationSeconds,
    difficulty: history.problem.difficulty,
    tags: parseJson<string[]>(history.problemTags, parseTags(history.problem.tags)),
  }));
  const growthProblems = problems.map<GrowthProblem>((problem) => ({
    id: problem.id,
    difficulty: problem.difficulty,
    hot150Order: problem.hot150Order,
    tags: parseTags(problem.tags),
  }));

  return buildGrowthStats(growthProblems, attempts, now);
}

export function buildGrowthStats(
  problems: GrowthProblem[],
  attempts: GrowthAttempt[],
  now: Date = new Date(),
): GrowthStats {
  return {
    streakDays: computeStreak(attempts, now),
    weeklyProblemCount: computeWeeklyCount(attempts, now),
    solvedCount: computeSolvedCount(attempts),
    top150Total: hot150Problems(problems).length,
    avgDurationSeconds: computeAvgDuration(attempts),
    dailyActivity: computeDailyActivity(attempts, now),
    attemptsToFirstAc: computeAttemptsToFirstAc(attempts),
    categoryProgress: computeCategoryProgress(problems, attempts),
    difficultyMix: computeDifficultyMix(attempts),
  };
}

export function computeStreak(
  attempts: GrowthAttempt[],
  now: Date = new Date(),
) {
  const activeDates = new Set(attempts.map((a) => dateKey(a.createdAt)));
  let cursor = startOfPlannerDay(now);
  let streak = 0;

  while (activeDates.has(toPlannerDateInput(cursor))) {
    streak += 1;
    cursor = addPlannerDays(cursor, -1);
  }

  return streak;
}

export function computeWeeklyCount(
  attempts: GrowthAttempt[],
  now: Date = new Date(),
) {
  const start = addPlannerDays(startOfPlannerDay(now), -6);
  const end = addPlannerDays(startOfPlannerDay(now), 1);
  return new Set(
    attempts
      .filter((a) => a.createdAt >= start && a.createdAt < end)
      .map((a) => a.problemId),
  ).size;
}

export function computeSolvedCount(attempts: GrowthAttempt[]) {
  return solvedProblemIds(attempts).size;
}

export function computeAvgDuration(attempts: GrowthAttempt[]) {
  const durations = attempts
    .map((attempt) => attempt.durationSeconds)
    .filter((value): value is number => typeof value === "number");

  if (durations.length === 0) {
    return null;
  }

  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

export function computeDailyActivity(
  attempts: GrowthAttempt[],
  now: Date = new Date(),
  days = DEFAULT_ACTIVITY_DAYS,
): DailyActivityPoint[] {
  const buckets = new Map<string, { problemIds: Set<string>; seconds: number }>();
  const start = addPlannerDays(startOfPlannerDay(now), -(days - 1));

  for (let offset = 0; offset < days; offset += 1) {
    buckets.set(toPlannerDateInput(addPlannerDays(start, offset)), {
      problemIds: new Set<string>(),
      seconds: 0,
    });
  }

  for (const attempt of attempts) {
    const key = dateKey(attempt.createdAt);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.problemIds.add(attempt.problemId);
    bucket.seconds += attempt.durationSeconds ?? 0;
  }

  return [...buckets.entries()].map(([date, bucket]) => ({
    date,
    problemCount: bucket.problemIds.size,
    minutes: Math.round(bucket.seconds / 60),
  }));
}

export function computeAttemptsToFirstAc(
  attempts: GrowthAttempt[],
): AttemptsToFirstAcPoint[] {
  return groupAttempts(attempts)
    .map((group) => firstAcPoint(group))
    .filter((point): point is AttemptsToFirstAcPoint => Boolean(point))
    .sort((a, b) => a.firstAcDate.localeCompare(b.firstAcDate));
}

export function computeCategoryProgress(
  problems: GrowthProblem[],
  attempts: GrowthAttempt[],
): CategoryProgress[] {
  const attemptedIds = new Set(attempts.map((attempt) => attempt.problemId));
  const passedIds = solvedProblemIds(attempts);
  const categories = new Map<string, CategoryProgress>();

  for (const problem of hot150Problems(problems)) {
    const category = classifyProblem(problem.tags);
    const current =
      categories.get(category) ??
      { category, total: 0, attempted: 0, passed: 0 };
    current.total += 1;
    if (attemptedIds.has(problem.id)) current.attempted += 1;
    if (passedIds.has(problem.id)) current.passed += 1;
    categories.set(category, current);
  }

  return [...categories.values()].sort((a, b) => b.total - a.total);
}

export function computeDifficultyMix(attempts: GrowthAttempt[]): DifficultyMix {
  const byProblem = latestPassedByProblem(attempts);
  const mix: DifficultyMix = { Easy: 0, Medium: 0, Hard: 0 };

  for (const attempt of byProblem.values()) {
    if (attempt.difficulty === "Easy") mix.Easy += 1;
    if (attempt.difficulty === "Medium") mix.Medium += 1;
    if (attempt.difficulty === "Hard") mix.Hard += 1;
  }

  return mix;
}

function dateKey(date: Date) {
  return toPlannerDateInput(date);
}

function firstAcPoint(group: GrowthAttempt[]) {
  const sorted = [...group].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const firstPassedIndex = sorted.findIndex(
    (attempt) => runStatusKind(attempt.runStatus) === "passed",
  );

  if (firstPassedIndex < 0) {
    return null;
  }

  const passed = sorted[firstPassedIndex];
  return {
    problemId: passed.problemId,
    problemTitle: passed.problemTitle,
    firstAcDate: dateKey(passed.createdAt),
    attemptsToAc: firstPassedIndex + 1,
  };
}

function groupAttempts(attempts: GrowthAttempt[]) {
  const byProblem = new Map<string, GrowthAttempt[]>();
  for (const attempt of attempts) {
    byProblem.set(attempt.problemId, [...(byProblem.get(attempt.problemId) ?? []), attempt]);
  }
  return [...byProblem.values()];
}

function solvedProblemIds(attempts: GrowthAttempt[]) {
  return new Set(latestPassedByProblem(attempts).keys());
}

function latestPassedByProblem(attempts: GrowthAttempt[]) {
  const passed = new Map<string, GrowthAttempt>();
  for (const attempt of attempts) {
    if (runStatusKind(attempt.runStatus) === "passed") {
      passed.set(attempt.problemId, attempt);
    }
  }
  return passed;
}

function hot150Problems(problems: GrowthProblem[]) {
  return problems.filter(
    (problem) => problem.hot150Order !== null || problem.tags.includes("hot150"),
  );
}

function parseTags(value: string | null | undefined) {
  return parseJson<string[]>(value, []);
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(fallback) && !Array.isArray(parsed) ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}
