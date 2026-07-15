import { localUserHandle, publicDefaultProfile } from "@/features/onboarding/profile-defaults";
import prisma from "@/server/db/prisma";
import { loadGrowthStats } from "@/server/growth/growth-stats";
import {
  addPlannerDays,
  calculateDailyDose,
  daysBetweenPlannerDates,
  intervalForRating,
  normalizePlannerTag,
  startOfPlannerDay,
} from "./planner-rules";
import { buildReviewFocusBoard } from "./review-focus/build-review-focus-board";
import {
  plannerGoalInputSchema,
  plannerOutcomeInputSchema,
  plannerSkipInputSchema,
  plannerStartInputSchema,
  type TodayPlannerData,
} from "./planner.types";

export class PlannerError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

async function localUser() {
  return prisma.user.upsert({ where: { handle: localUserHandle }, update: {}, create: { handle: localUserHandle } });
}

export async function createOrUpdatePlannerGoal(input: unknown) {
  const data = plannerGoalInputSchema.parse(input);
  const user = await localUser();
  const interviewDate = new Date(`${data.interviewDate}T12:00:00Z`);
  if (Number.isNaN(interviewDate.getTime())) throw new PlannerError("Interview date is invalid.");
  const dailyDoseTarget = calculateDailyDose(data.weeklyHours);
  await prisma.readinessGoal.updateMany({ where: { userId: user.id, status: "active" }, data: { status: "replaced" } });
  const goal = await prisma.readinessGoal.create({
    data: { userId: user.id, targetLabel: data.targetLabel, interviewDate, weeklyHours: data.weeklyHours, dailyDoseTarget },
  });
  const problems = await prisma.problem.findMany({ orderBy: { hot150Order: "asc" } });
  await prisma.plannerPlanItem.createMany({
    data: problems.map((problem, index) => ({
      userId: user.id,
      goalId: goal.id,
      problemId: problem.id,
      source: "plan",
      status: "pending",
      scheduledDate: addPlannerDays(new Date(), Math.floor(index / dailyDoseTarget)),
      sortOrder: index + 1,
      whyJson: JSON.stringify([{ source: "plan", label: "Hot-150", detail: "Deterministic catalog schedule" }]),
    })),
  });
  return goal;
}

export async function getTodayPlannerData(): Promise<TodayPlannerData> {
  const user = await localUser();
  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  const displayName = profile?.displayName ?? publicDefaultProfile.displayName;
  const goal = await prisma.readinessGoal.findFirst({ where: { userId: user.id, status: "active" }, orderBy: { createdAt: "desc" } });
  if (!goal) {
    return { hasGoal: false, displayName, defaultTargetLabel: "Hot-150 interview preparation", defaultInterviewDate: addPlannerDays(new Date(), 60).toISOString().slice(0, 10), defaultWeeklyHours: 7 };
  }
  const items = await prisma.plannerPlanItem.findMany({
    where: { goalId: goal.id },
    orderBy: { sortOrder: "asc" },
    include: { problem: true },
  });
  const today = startOfPlannerDay(new Date());
  const tomorrow = addPlannerDays(today, 1);
  const completedTodayItems = items.filter(
    (item) => item.status === "completed" && item.completedAt && item.completedAt >= today && item.completedAt < tomorrow,
  );
  const activeDueItems = items.filter(
    (item) => (item.status === "pending" || item.status === "in_progress") && item.scheduledDate && item.scheduledDate < tomorrow,
  );
  const next = (
    activeDueItems.length > 0 && completedTodayItems.length >= goal.dailyDoseTarget
      ? activeDueItems
      : [...completedTodayItems, ...activeDueItems]
  ).slice(-goal.dailyDoseTarget);
  const [growth, reviewFocus, completedToday] = await Promise.all([
    loadGrowthStats(prisma, user.id, today),
    buildReviewFocusBoard(prisma, { userId: user.id, goalId: goal.id, now: today }),
    prisma.plannerOutcome.count({
      where: { userId: user.id, createdAt: { gte: today, lt: addPlannerDays(today, 1) } },
    }),
  ]);
  return {
    hasGoal: true,
    displayName,
    goal: { id: goal.id, targetLabel: goal.targetLabel, interviewDate: goal.interviewDate.toISOString(), weeklyHours: goal.weeklyHours, dailyDoseTarget: goal.dailyDoseTarget, daysRemaining: daysBetweenPlannerDates(today, goal.interviewDate), planVersion: goal.planVersion },
    coverage: buildCoverage(items, completedToday),
    growth: {
      streakDays: growth.streakDays,
      weeklyProblemCount: growth.weeklyProblemCount,
      solvedCount: growth.solvedCount,
      top150Total: growth.top150Total,
    },
    reviewFocus,
    dose: next.map((item) => ({
      planItemId: item.id,
      problemId: item.problemId,
      slug: item.problem.slug,
      title: item.problem.title,
      leetcodeNumber: item.problem.leetcodeNumber,
      difficulty: item.problem.difficulty,
      tags: JSON.parse(item.problem.tags) as string[],
      source: item.source as "plan" | "review" | "weakness" | "replan",
      status: item.status as "pending" | "in_progress" | "completed",
      scheduledDate: item.scheduledDate?.toISOString() ?? null,
      why: JSON.parse(item.whyJson),
    })),
  };
}

function buildCoverage(
  items: Array<{ status: string; problem: { tags: string } }>,
  completedToday: number,
) {
  const activeItems = items.filter((item) => item.status !== "replaced");
  const patterns = new Map<string, { completed: number; total: number }>();
  for (const item of activeItems) {
    const tags = parseStringArray(item.problem.tags);
    const tag = tags[0] ?? "Other";
    const value = patterns.get(tag) ?? { completed: 0, total: 0 };
    value.total += 1;
    if (item.status === "completed") value.completed += 1;
    patterns.set(tag, value);
  }
  return {
    completedPlanItems: activeItems.filter((item) => item.status === "completed").length,
    totalPlanItems: activeItems.length,
    completedToday,
    patternCoverage: [...patterns.entries()]
      .map(([tag, value]) => ({ tag, ...value }))
      .sort((left, right) => right.total - left.total)
      .slice(0, 6),
  };
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export const buildTodayDose = getTodayPlannerData;
export const findNextTodayDoseItem = getTodayPlannerData;

export async function advancePlannerDoseBatch() {
  const data = await getTodayPlannerData();
  if (!data.hasGoal) throw new PlannerError("Create a local readiness goal first.", 400);
  if (data.dose.length > 0 && !data.dose.every((item) => item.status === "completed")) {
    throw new PlannerError("Finish or skip the current dose before continuing.", 409);
  }
  const user = await localUser();
  const nextItems = await prisma.plannerPlanItem.findMany({
    where: { userId: user.id, goalId: data.goal.id, status: "pending" },
    orderBy: { sortOrder: "asc" },
    take: data.goal.dailyDoseTarget,
    select: { id: true },
  });
  if (nextItems.length === 0) return { advanced: false, dose: [] };
  await prisma.plannerPlanItem.updateMany({
    where: { id: { in: nextItems.map(({ id }) => id) } },
    data: { scheduledDate: startOfPlannerDay(new Date()) },
  });
  const refreshed = await getTodayPlannerData();
  return { advanced: true, dose: refreshed.hasGoal ? refreshed.dose : [] };
}
export const advancePlannerDay = advancePlannerDoseBatch;

export async function skipPlannerDoseItem(input: unknown) {
  const { planItemId } = plannerSkipInputSchema.parse(input);
  const item = await prisma.plannerPlanItem.findUnique({ where: { id: planItemId } });
  if (!item) throw new PlannerError("Planner item not found.", 404);
  return prisma.plannerPlanItem.update({ where: { id: planItemId }, data: { scheduledDate: addPlannerDays(new Date(), 1), deferredFromDate: item.scheduledDate } });
}

export async function startPlannerPlanItem(input: unknown) {
  const { planItemId } = plannerStartInputSchema.parse(input);
  const item = await prisma.plannerPlanItem.update({ where: { id: planItemId }, data: { status: "in_progress", startedAt: new Date(), lastOpenedAt: new Date() }, include: { problem: true } });
  return { planItemId: item.id, redirectTo: `/workbench?problem=${encodeURIComponent(item.problem.slug)}&planItemId=${item.id}` };
}

export async function recordPlannerOutcome(input: unknown) {
  const data = plannerOutcomeInputSchema.parse(input);
  const user = await localUser();
  const existing = await prisma.plannerOutcome.findUnique({ where: { reviewAttemptId: data.reviewAttemptId } });
  if (existing) return { outcome: existing, proposalCreated: false, alreadyRecorded: true };
  const history = await prisma.problemHistory.findFirst({ where: { id: data.problemHistoryId, userId: user.id, reviewAttemptId: data.reviewAttemptId } });
  if (!history) throw new PlannerError("Problem history record not found.", 404);
  const activeGoal = await prisma.readinessGoal.findFirst({
    where: { userId: user.id, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  const item = data.planItemId
    ? await prisma.plannerPlanItem.findFirst({
        where: {
          id: data.planItemId,
          userId: user.id,
          problemId: history.problemId,
          ...(activeGoal ? { goalId: activeGoal.id } : {}),
        },
      })
    : activeGoal
      ? await prisma.plannerPlanItem.findFirst({
          where: {
            userId: user.id,
            goalId: activeGoal.id,
            problemId: history.problemId,
            status: { not: "replaced" },
          },
        })
      : null;
  const completedAt = new Date();
  const patternTag = parseStringArray(history.problemTags)[0];
  const outcome = await prisma.$transaction(async (tx) => {
    const created = await tx.plannerOutcome.create({
      data: {
        userId: history.userId,
        goalId: item?.goalId,
        planItemId: item?.id,
        problemId: history.problemId,
        reviewAttemptId: data.reviewAttemptId,
        problemHistoryId: history.id,
        selfRating: data.selfRating,
        patternTagsJson: history.problemTags,
      },
    });
    if (!item) return created;

    await tx.plannerPlanItem.update({
      where: { id: item.id },
      data: { status: "completed", completedAt },
    });
    const scheduleKey = {
      userId_goalId_problemId: {
        userId: user.id,
        goalId: item.goalId,
        problemId: history.problemId,
      },
    };
    const previous = await tx.reviewSchedule.findUnique({ where: scheduleKey });
    const intervalDays = intervalForRating({
      rating: data.selfRating,
      repetitions: previous?.repetitions ?? 0,
    });
    await tx.reviewSchedule.upsert({
      where: scheduleKey,
      update: {
        patternTag: patternTag ? normalizePlannerTag(patternTag) : null,
        dueDate: addPlannerDays(completedAt, intervalDays),
        intervalDays,
        repetitions: (previous?.repetitions ?? 0) + 1,
        lastRating: data.selfRating,
        lastOutcomeId: created.id,
        status: "active",
      },
      create: {
        userId: user.id,
        goalId: item.goalId,
        problemId: history.problemId,
        patternTag: patternTag ? normalizePlannerTag(patternTag) : null,
        dueDate: addPlannerDays(completedAt, intervalDays),
        intervalDays,
        repetitions: 1,
        lastRating: data.selfRating,
        lastOutcomeId: created.id,
      },
    });
    return created;
  });
  return { outcome, proposalCreated: false, alreadyRecorded: false };
}
