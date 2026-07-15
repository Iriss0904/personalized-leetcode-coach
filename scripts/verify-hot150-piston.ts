import { publicHot150Bank } from "@/data/hot150/local-bank.public";
import type { PublicHot150Problem } from "@/data/hot150/local-run-types";
import { loadLocalEnv } from "@/lib/env";
import { runCodeWithTests } from "@/server/tools/code-runner/run-code-with-tests";

loadLocalEnv();

const failures: string[] = [];
let completed = 0;
const concurrency = 5;

for (let offset = 0; offset < publicHot150Bank.problems.length; offset += concurrency) {
  const batch = publicHot150Bank.problems.slice(offset, offset + concurrency);
  await Promise.all(batch.map(verifyProblem));
  if (completed % 25 === 0 || completed === publicHot150Bank.problems.length) {
    console.log(`Checked ${completed}/${publicHot150Bank.problems.length} Piston contracts.`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`BLOCKED: ${failure}`);
  process.exit(1);
}

console.log(
  "PASS: all 150 public Python contracts produced complete real Piston test results.",
);

async function verifyProblem(problem: PublicHot150Problem) {
  try {
    const result = await runCodeWithTests({
      problem,
      language: "Python",
      code: nonSolutionProbe(problem),
      testCases: problem.visibleTests.map((test) => ({
        ...test,
        source: "public_visible" as const,
      })),
    });
    if (
      result.evidenceKind !== "executed" ||
      result.providerUsed !== "piston" ||
      result.status === "runner_error" ||
      result.status === "syntax_error" ||
      result.totalCount !== problem.visibleTests.length ||
      result.testResults.length !== problem.visibleTests.length
    ) {
      failures.push(
        `${problem.number} ${problem.slug}: ${result.status}; ${result.testResults.length}/${problem.visibleTests.length} test results`,
      );
    }
  } catch (error) {
    failures.push(
      `${problem.number} ${problem.slug}: ${error instanceof Error ? error.message : "unknown verification failure"}`,
    );
  } finally {
    completed += 1;
  }
}

function nonSolutionProbe(problem: PublicHot150Problem) {
  if (problem.signature.contractKind === "design_object") {
    return [
      `class ${problem.signature.className}:`,
      "    def __init__(self, *args):",
      "        pass",
      "",
      "    def __getattr__(self, _name):",
      "        return lambda *args: None",
    ].join("\n");
  }

  const parameters = problem.signature.parameters
    .map(({ name }) => name)
    .join(", ");
  return [
    "class Solution:",
    `    def ${problem.signature.methodName}(self${parameters ? `, ${parameters}` : ""}):`,
    "        return None",
  ].join("\n");
}
