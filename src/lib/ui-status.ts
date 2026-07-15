export type RunStatusKind = "passed" | "failed" | "unknown";

const PASSED_STATUSES = new Set([
  "passed",
  "passed_visible_tests",
  "accepted",
  "ac",
  "all_passed",
]);
const FAILED_STATUSES = new Set([
  "failed",
  "wrong_answer",
  "runtime_error",
  "compile_error",
  "syntax_error",
  "timeout",
  "time_limit_exceeded",
]);

const NEUTRAL_STATUS_LABELS: Record<string, string> = {
  runner_error: "Unavailable",
  no_tests: "Needs tests",
  empty_code: "Needs code",
  unsupported_language: "Unsupported",
};

export function runStatusKind(status: string): RunStatusKind {
  const value = status.trim().toLowerCase();
  if (PASSED_STATUSES.has(value)) return "passed";
  if (FAILED_STATUSES.has(value)) return "failed";
  return "unknown";
}

export function runStatusLabel(status: string): string {
  const neutralLabel = NEUTRAL_STATUS_LABELS[status.trim().toLowerCase()];
  if (neutralLabel) return neutralLabel;
  const kind = runStatusKind(status);
  if (kind === "passed") return "Passed";
  if (kind === "failed") return "Failed";
  return "Unknown";
}

export function difficultyBadgeClass(difficulty: string | null): string {
  if (difficulty === "Easy") return "border-emerald-200 bg-emerald-100 text-emerald-700";
  if (difficulty === "Medium") return "border-amber-200 bg-amber-100 text-amber-700";
  if (difficulty === "Hard") return "border-rose-200 bg-rose-100 text-rose-700";
  return "border-border bg-muted text-muted-foreground";
}

export function runStatusBadgeClass(status: string): string {
  const kind = runStatusKind(status);
  if (kind === "passed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (kind === "failed") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-border bg-muted text-muted-foreground";
}

export type SkillStatus = "Strong" | "Learning" | "Watch" | "Unobserved";

export function skillStatusBarClass(status: SkillStatus): string {
  if (status === "Strong") return "bg-emerald-500";
  if (status === "Learning") return "bg-sky-500";
  if (status === "Watch") return "bg-amber-500";
  return "bg-muted-foreground/30";
}

export function skillStatusBadgeClass(status: SkillStatus): string {
  if (status === "Strong") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "Learning") return "border-sky-200 bg-sky-50 text-sky-800";
  if (status === "Watch") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-border bg-muted text-muted-foreground";
}
