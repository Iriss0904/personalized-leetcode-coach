import { z } from "zod";
import type { ReviewFocusBoard } from "@/server/planner/review-focus/review-focus.types";

export const PLANNER_MINUTES_PER_PROBLEM = 45;
export const PLANNER_MAX_DAILY_DOSE = 5;

export const plannerGoalInputSchema = z.object({
  targetLabel: z.string().trim().min(1).max(80),
  interviewDate: z.string().trim().min(1),
  weeklyHours: z.coerce.number().min(1).max(80),
});
export const plannerSelfRatingSchema = z.enum(["easy", "hesitated", "struggled", "unsolved"]);
export const plannerOutcomeInputSchema = z.object({
  planItemId: z.string().optional(),
  reviewAttemptId: z.string().trim().min(1),
  problemHistoryId: z.string().trim().min(1),
  selfRating: plannerSelfRatingSchema,
});
export const plannerStartInputSchema = z.object({ planItemId: z.string().trim().min(1) });
export const plannerSkipInputSchema = z.object({ planItemId: z.string().trim().min(1) });

export type PlannerGoalInput = z.infer<typeof plannerGoalInputSchema>;
export type PlannerSelfRating = z.infer<typeof plannerSelfRatingSchema>;
export type PlannerOutcomeInput = z.infer<typeof plannerOutcomeInputSchema>;
export type PlannerStartInput = z.infer<typeof plannerStartInputSchema>;
export type PlannerSkipInput = z.infer<typeof plannerSkipInputSchema>;
export type PlannerPlanItemSource = "plan" | "review" | "weakness" | "replan";
export type PlannerWhy = { source: PlannerPlanItemSource; label: string; detail: string };
export type TodayDoseItem = {
  planItemId: string;
  problemId: string;
  slug: string;
  title: string;
  leetcodeNumber: number;
  difficulty: string;
  tags: string[];
  source: PlannerPlanItemSource;
  status: "pending" | "in_progress" | "completed";
  scheduledDate: string | null;
  why: PlannerWhy[];
};
export type PlannerCoverage = {
  completedPlanItems: number;
  totalPlanItems: number;
  completedToday: number;
  patternCoverage: Array<{ tag: string; completed: number; total: number }>;
};
export type TodayGrowthStats = {
  streakDays: number;
  weeklyProblemCount: number;
  solvedCount: number;
  top150Total: number;
};
export type TodayPlannerData =
  | { hasGoal: false; displayName: string; defaultTargetLabel: string; defaultInterviewDate: string; defaultWeeklyHours: number }
  | {
      hasGoal: true;
      displayName: string;
      goal: { id: string; targetLabel: string; interviewDate: string; weeklyHours: number; dailyDoseTarget: number; daysRemaining: number; planVersion: number };
      coverage: PlannerCoverage;
      growth: TodayGrowthStats;
      dose: TodayDoseItem[];
      reviewFocus: ReviewFocusBoard;
    };
