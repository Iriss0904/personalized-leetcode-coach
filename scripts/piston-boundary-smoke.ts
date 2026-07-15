import { publicHot150Bank } from "@/data/hot150/local-bank.public";
import { loadLocalEnv } from "@/lib/env";
import { runCodeWithTests } from "@/server/tools/code-runner/run-code-with-tests";
import type { CodeRunResult } from "@/types/code-runner";

loadLocalEnv();

const problem = publicHot150Bank.problems.find(({ slug }) => slug === "two-sum");
if (!problem) throw new Error("The public Two Sum contract is missing.");

const testCases = problem.visibleTests.slice(0, 1).map((test) => ({
  ...test,
  source: "public_visible" as const,
}));
const probes: Array<{
  name: string;
  code: string;
  expected: CodeRunResult["status"];
  limits?: { runTimeoutMs: number };
}> = [
  {
    name: "syntax error",
    code: "class Solution:\n    def twoSum(self, nums, target)\n        return []",
    expected: "syntax_error",
  },
  {
    name: "runtime error",
    code: "class Solution:\n    def twoSum(self, nums, target):\n        raise RuntimeError('synthetic probe')",
    expected: "runtime_error",
  },
  {
    name: "timeout",
    code: "class Solution:\n    def twoSum(self, nums, target):\n        while True:\n            pass",
    expected: "timeout",
    limits: { runTimeoutMs: 250 },
  },
];

for (const probe of probes) {
  const result = await runCodeWithTests({
    problem,
    language: "Python",
    code: probe.code,
    testCases,
    limits: probe.limits,
  });
  const passed =
    result.status === probe.expected &&
    result.evidenceKind === "executed" &&
    result.providerUsed === "piston";
  console.log(
    `${passed ? "PASS" : "FAIL"}: ${probe.name} -> ${result.status} (${result.evidenceKind}, ${result.providerUsed})`,
  );
  if (!passed) process.exitCode = 1;
}
