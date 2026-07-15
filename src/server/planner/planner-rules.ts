import { PLANNER_MAX_DAILY_DOSE, PLANNER_MINUTES_PER_PROBLEM } from "./planner.types";

export function plannerTimeZone() { return process.env.TZ || "UTC"; }
export function startOfPlannerDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}
export function addPlannerDays(date: Date, days: number) {
  const value = startOfPlannerDay(date);
  value.setDate(value.getDate() + days);
  return value;
}
export function daysBetweenPlannerDates(from: Date, to: Date) {
  return Math.max(0, Math.ceil((startOfPlannerDay(to).getTime() - startOfPlannerDay(from).getTime()) / 86_400_000));
}
export function toPlannerDateInput(date: Date) { return date.toISOString().slice(0, 10); }
export function calculateDailyDose(weeklyHours: number) {
  return Math.max(1, Math.min(PLANNER_MAX_DAILY_DOSE, Math.floor((weeklyHours * 60) / (7 * PLANNER_MINUTES_PER_PROBLEM))));
}
export function intervalForRating(args: { rating: "easy" | "hesitated" | "struggled" | "unsolved"; repetitions?: number }) {
  const base = { easy: 7, hesitated: 3, struggled: 2, unsolved: 1 }[args.rating];
  return base * Math.max(1, (args.repetitions ?? 0) + 1);
}
export function normalizePlannerTag(tag: string) { return tag.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
export function primaryPatternTag(tags: string[]) { return tags[0] ?? "general"; }
export function plannerPatternTags(tags: string[]) { return [...new Set(tags.map(normalizePlannerTag))]; }
export function formatPlannerTag(tag: string) { return tag.replace(/-/g, " ").replace(/\b\w/g, (value) => value.toUpperCase()); }
export function plannerDisplayTags(tags: string[]) { return plannerPatternTags(tags).map(formatPlannerTag); }
