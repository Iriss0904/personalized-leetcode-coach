import { normalizeMemoryTag } from "@/server/memory/memory.types";

const SELF_CHECK_NOISE_TAGS = new Set([
  "no_search_logic",
  "hardcoded_return",
  "syntax_error",
  "indentation_error",
  "missing_return",
  "missing_pass_in_init",
  "initialization_error",
]);

const PASSED_STATUSES = new Set([
  "passed",
  "passed_visible_tests",
  "accepted",
  "ac",
  "all_passed",
]);

const DEGRADED_DIAGNOSIS_PATTERNS = [
  /\bevidence[- ]only\b/i,
  /\bstructured diagnosis\b/i,
  /\bstructured json\b/i,
  /\bdid not return usable\b/i,
  /\bdiagnosis metadata was rebuilt\b/i,
  /\bdiagnosis was unavailable\b/i,
  /\bskipped l2 fact updates\b/i,
  /\brunner status:/i,
  /基于执行证据/i,
  /结构化诊断/i,
];

export type SelfCheckDiagnosisEligibilityInput = {
  mistakeTags: string[];
  userIssueSummary?: string | null;
  coachSummary?: string | null;
  runStatus?: string | null;
};

export function isSelfCheckNoiseTag(tag: string) {
  const normalized = normalizeMemoryTag(tag);
  return (
    SELF_CHECK_NOISE_TAGS.has(normalized) ||
    normalized.startsWith("run_status_")
  );
}

export function nonNoiseSelfCheckTags(tags: string[]) {
  return [...new Set(tags.map(normalizeMemoryTag).filter(Boolean))].filter(
    (tag) => !isSelfCheckNoiseTag(tag),
  );
}

export function isPassedRunStatus(status: string | null | undefined) {
  const value = status?.trim().toLowerCase();
  return value ? PASSED_STATUSES.has(value) : false;
}

export function isGenuineDiagnosisForSelfCheck(
  diagnosis: SelfCheckDiagnosisEligibilityInput | null | undefined,
) {
  if (!diagnosis) {
    return false;
  }

  if (isPassedRunStatus(diagnosis.runStatus)) {
    return false;
  }

  if (nonNoiseSelfCheckTags(diagnosis.mistakeTags).length === 0) {
    return false;
  }

  const text = `${diagnosis.userIssueSummary ?? ""}\n${
    diagnosis.coachSummary ?? ""
  }`;
  return !DEGRADED_DIAGNOSIS_PATTERNS.some((pattern) => pattern.test(text));
}
