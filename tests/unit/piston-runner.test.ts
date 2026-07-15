import { describe, expect, it } from "vitest";
import { normalizePistonResponse, PISTON_RESULT_MARKER } from "@/server/tools/code-runner/normalize-run-result";
import { isPublicPythonRuntime, PUBLIC_PYTHON_RUNTIME } from "@/server/tools/code-runner/runtime-config";

describe("public Piston result contract", () => {
  it("marks a real harness result as executed", () => {
    const payload = { status: "completed", testResults: [{ id: "visible-1", label: "Synthetic", passed: true, stdout: "", stderr: "" }] };
    const result = normalizePistonResponse({ run: { code: 0, stdout: `${PISTON_RESULT_MARKER}${JSON.stringify(payload)}`, stderr: "" } }, 12);
    expect(result.evidenceKind).toBe("executed");
    expect(result.providerUsed).toBe("piston");
    expect(result.status).toBe("passed_visible_tests");
  });

  it("pins the public runner to Python 3.12", () => {
    expect(PUBLIC_PYTHON_RUNTIME).toEqual({
      language: "python",
      version: "3.12.0",
    });
    expect(isPublicPythonRuntime({ language: "python", version: "3.12.0" })).toBe(true);
    expect(isPublicPythonRuntime({ language: "python2", version: "2.7.18" })).toBe(false);
  });
});
