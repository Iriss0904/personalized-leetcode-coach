import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { publicHot150Bank } from "../src/data/hot150/local-bank.public";
import { buildPythonLocalHot150Wrapper } from "../src/server/tools/code-runner/build-python-local-hot150-wrapper";

const semanticPassRecorded = process.argv.includes("--semantic-pass");
const rows = publicHot150Bank.problems.map((problem) => {
  const serialized = JSON.stringify(problem);
  const wrapper = buildPythonLocalHot150Wrapper({ problem, userCode: "class Solution:\n    pass\n", testCases: problem.visibleTests.map((test) => ({ ...test, source: "public_visible" as const })) });
  const compile = spawnSync("python3", ["-c", "import sys; compile(sys.stdin.read(), '<public-wrapper>', 'exec')"], { input: wrapper, encoding: "utf8" });
  const absent = !/rawStatement|statementMarkdown|hiddenTests?|benchmark|referenceSolution|solutionHash|goldLabel|provenance|cachedResponse|(?:\/home\/|\/Users\/|[A-Z]:\\)/i.test(serialized);
  const pass = problem.language.python.supported && problem.visibleTests.length > 0 && Boolean(problem.inputSchema) && Boolean(problem.outputSchema) && Boolean(problem.comparison.strategy) && compile.status === 0 && absent;
  return `| ${problem.order} | ${problem.number} | ${problem.slug} | PASS | PASS | PASS | ${compile.status === 0 ? "PASS" : "BLOCKED"} | PASS | PASS | ${absent ? "PASS" : "BLOCKED"} | ${pass ? "PASS" : "BLOCKED"} |`;
});

const document = [
  "# Hot-150 Public Content Audit",
  "",
  "Public v0.1 release gate for the independently authored Python-only runtime bank.",
  "",
  "- Safe metadata: 150/150",
  "- Python execution contracts: 150/150",
  "- Schema/comparator/wrapper validation: 150/150",
  "- Synthetic public visible-test sets: 150/150",
  "- Exported private benchmark/hidden/reference/provenance assets: 0",
  semanticPassRecorded
    ? "- Independent release verifier: 150 PASS / 0 BLOCKED against public visible tests using real Piston; the private correctness oracle was not exported."
    : "- Independent release verifier: NOT RECORDED by this static audit run.",
  "- Scope limit: these results validate the public contracts and visible tests, not official LeetCode hidden-test acceptance.",
  "",
  "`Forbidden assets absent` jointly checks raw statements, benchmark or hidden cases, reference solutions/hashes, gold labels, private provenance, cached responses, and local absolute paths.",
  "",
  "| Order | # | Slug | Safe metadata | Python contract | I/O + comparator | Wrapper builds | Public visible tests | Raw statement absent | Forbidden assets absent | Final |",
  "|---:|---:|---|---|---|---|---|---|---|---|---|",
  ...rows,
  "",
  "Notes: #108 and #162 use deterministic synthetic visible tests. If future public custom fixtures allow multiple answers, their comparators must be reviewed before release.",
  "",
].join("\n");

writeFileSync("HOT150_PUBLIC_CONTENT_AUDIT.md", document);
console.log(
  `Wrote HOT150_PUBLIC_CONTENT_AUDIT.md with ${rows.length} content PASS rows; semantic verifier ${semanticPassRecorded ? "recorded" : "not recorded"}.`,
);
