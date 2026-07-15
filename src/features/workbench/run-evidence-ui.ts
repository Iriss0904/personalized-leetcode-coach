import type { CodeRunResult } from "@/types/code-runner";

export function summarizeRunEvidence(result: CodeRunResult) {
  if (result.evidenceKind !== "executed") {
    return "Execution unavailable. Start local Piston and try again.";
  }
  if (result.status === "passed_visible_tests") {
    return `${result.passedCount}/${result.totalCount} selected visible tests passed locally.`;
  }
  if (result.firstFailedCase) {
    return `First failing visible test: ${result.firstFailedCase.label}.`;
  }
  return result.stderr || result.status;
}
