import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { publicHot150Bank } from "@/data/hot150/local-bank.public";
import { validatePublicHot150Bank } from "@/data/hot150/local-run-types";
import { buildPythonLocalHot150Wrapper } from "@/server/tools/code-runner/build-python-local-hot150-wrapper";
describe("public Hot-150 runtime bank", () => {
  it("contains exactly 150 validated Python contracts", () => { expect(validatePublicHot150Bank(publicHot150Bank).success).toBe(true); expect(publicHot150Bank.problems).toHaveLength(150); expect(new Set(publicHot150Bank.problems.map(({ slug }) => slug)).size).toBe(150); });
  it("describes next-pointer level markers in the public output schema", () => {
    const problem = publicHot150Bank.problems.find(({ number }) => number === 117);
    expect(problem?.outputSchema.type).toBe("next_pointer_levels");
  });
  it("builds Python-compilable wrappers for every entry", () => {
    const wrappers = publicHot150Bank.problems.map((problem) => ({
      slug: problem.slug,
      source: buildPythonLocalHot150Wrapper({ problem, userCode: "class Solution:\n    pass\n", testCases: problem.visibleTests.map((test) => ({ ...test, source: "public_visible" as const })) }),
    }));
    const compiled = spawnSync(
      "python3",
      ["-c", "import json,sys\nfor item in json.load(sys.stdin): compile(item['source'], item['slug'], 'exec')"],
      { input: JSON.stringify(wrappers), encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
    );
    expect(compiled.status, compiled.stderr).toBe(0);
  });
});
