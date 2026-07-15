import { validatePublicTestInput } from "@/data/hot150/local-run-types";
import type { CodeRunResult } from "@/types/code-runner";
import { buildPythonLocalHot150Wrapper } from "./build-python-local-hot150-wrapper";
import type { CodeRunnerInput, CodeRunnerProvider } from "./code-runner.types";
import { normalizePistonResponse } from "./normalize-run-result";
import { PistonClient } from "./piston-client";
import { PUBLIC_PYTHON_RUNTIME } from "./runtime-config";

export function createPistonRunnerProvider(options: { client?: PistonClient } = {}): CodeRunnerProvider {
  const client = options.client ?? new PistonClient();
  return {
    async run(input) {
      const preflight = preflightResult(input);
      if (preflight) return preflight;

      const wrapper = buildPythonLocalHot150Wrapper({
        problem: input.problem,
        testCases: input.testCases,
        userCode: input.code,
      });
      const startedAt = Date.now();
      try {
        const response = await client.execute({
          language: PUBLIC_PYTHON_RUNTIME.language,
          version: PUBLIC_PYTHON_RUNTIME.version,
          files: [{ name: "main.py", content: wrapper }],
          stdin: "",
          args: [],
          compile_timeout: 10_000,
          run_timeout: input.limits?.runTimeoutMs ?? readPositiveInt(process.env.CODE_RUN_TIMEOUT_MS, 3_000),
          run_memory_limit:
            input.limits?.memoryBytes ?? readPositiveInt(process.env.CODE_RUN_MEMORY_BYTES, 128 * 1024 * 1024),
          output_max_size: 4 * 1024 * 1024,
        });
        return normalizePistonResponse(response, Date.now() - startedAt);
      } catch (error) {
        return unavailable(error instanceof Error ? error.message : "Piston is unavailable.");
      }
    },
  };
}

function preflightResult(input: CodeRunnerInput): CodeRunResult | undefined {
  if ((input.language as string) !== "Python") {
    return staticResult("unsupported_language", "Public v0.1 supports Python only.");
  }
  if (!input.code.trim()) {
    return staticResult("empty_code", "Enter Python code before running it.");
  }
  if (input.testCases.length === 0) {
    return staticResult("no_tests", "Select or add at least one visible test.");
  }
  for (const test of input.testCases) {
    const validation = validatePublicTestInput(input.problem, test.input);
    if (!validation.ok) {
      return staticResult(
        "runner_error",
        `Visible test ${test.id} does not match the public input schema: ${validation.issues.join("; ")}`,
      );
    }
  }
  return undefined;
}

function staticResult(status: CodeRunResult["status"], stderr: string): CodeRunResult {
  return {
    evidenceKind: "unavailable",
    status,
    passedCount: 0,
    failedCount: 0,
    totalCount: 0,
    stdout: "",
    stderr,
    testResults: [],
    providerUsed: "piston_unavailable",
  };
}

function unavailable(stderr: string): CodeRunResult {
  return staticResult("runner_error", `Local Piston is unavailable: ${stderr}`);
}

function readPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
