import { describe, expect, it } from "vitest";
import { classifyEvidence } from "@/lib/evidence-trust";
describe("execution evidence boundary", () => {
  it("does not allow unavailable evidence to update learning records", () => { expect(classifyEvidence({ evidenceKind: "unavailable", status: "runner_error", passedCount: 0, failedCount: 0, totalCount: 0, stdout: "", stderr: "offline", testResults: [], providerUsed: "piston_unavailable" }).canUpdateLearningRecords).toBe(false); });
});
