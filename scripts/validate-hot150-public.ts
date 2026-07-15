import { spawnSync } from "node:child_process";
import { publicHot150Bank } from "../src/data/hot150/local-bank.public";
import { validatePublicHot150Bank } from "../src/data/hot150/local-run-types";
import { buildPythonLocalHot150Wrapper } from "../src/server/tools/code-runner/build-python-local-hot150-wrapper";

const forbidden = /rawStatement|statementMarkdown|hiddenTests?|benchmark|referenceSolution|solutionHash|goldLabel|provenance|cachedResponse|(?:\/home\/|\/Users\/|[A-Z]:\\)/i;
const parsed = validatePublicHot150Bank(publicHot150Bank);
if (!parsed.success) throw new Error(parsed.error.message);

for (const problem of publicHot150Bank.problems) {
  if (forbidden.test(JSON.stringify(problem))) throw new Error(`${problem.slug}: forbidden public-bank field or value`);
  const wrapper = buildPythonLocalHot150Wrapper({ problem, userCode: "class Solution:\n    pass\n", testCases: problem.visibleTests.map((test) => ({ ...test, source: "public_visible" as const })) });
  const compile = spawnSync("python3", ["-c", "import sys; compile(sys.stdin.read(), '<public-wrapper>', 'exec')"], { input: wrapper, encoding: "utf8" });
  if (compile.status !== 0) throw new Error(`${problem.slug}: wrapper compile failed: ${compile.stderr}`);
}
console.log("PASS: 150 safe metadata entries, 150 Python contracts, 150 schemas/comparators/test sets, and 150 compilable wrappers.");
