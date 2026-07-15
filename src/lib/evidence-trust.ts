import type { CodeRunResult } from "@/types/code-runner";

export type EvidenceVerdict = {
  kind: "real_local" | "unavailable";
  canVerdict: boolean;
  canUpdateLearningRecords: boolean;
};

export function classifyEvidence(result: CodeRunResult): EvidenceVerdict {
  const real = result.evidenceKind === "executed" && result.providerUsed === "piston";
  return {
    kind: real ? "real_local" : "unavailable",
    canVerdict: real,
    canUpdateLearningRecords: real,
  };
}
