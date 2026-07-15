import type { CodeRunResult } from "@/types/code-runner";

export function publicFallbackReview(problemTitle: string, run: CodeRunResult) {
  const passed = run.status === "passed_visible_tests";
  const firstFailure = run.firstFailedCase;
  return [
    "## Status",
    passed ? "Your code passed the selected public visible tests." : "Your code needs another iteration.",
    "## Evidence",
    `${run.passedCount}/${run.totalCount} selected visible tests passed in local Piston. This is not hidden-test acceptance.`,
    "## Diagnosis",
    passed
      ? `The current implementation is consistent with the visible evidence for ${problemTitle}.`
      : firstFailure
        ? `Start with ${firstFailure.label}: expected ${JSON.stringify(firstFailure.expected)}, received ${JSON.stringify(firstFailure.actual)}.`
        : run.stderr || "Inspect the runtime result before changing the algorithm.",
    "## Pattern",
    "Name the invariant your loop, recursion, or data structure must preserve.",
    "## Next Step",
    passed
      ? "Add one boundary-focused custom visible test and run it locally."
      : "Trace only the first failing case and write down where the invariant first breaks.",
  ].join("\n\n");
}
