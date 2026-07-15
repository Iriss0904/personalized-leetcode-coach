import { z } from "zod";
import type { CodeRunResult, CodeRunTestResult } from "@/types/code-runner";

export const PISTON_RESULT_MARKER = "__PATTERNCOACH_PUBLIC_RESULT__";

const processResultSchema = z.object({
  stdout: z.string().default(""),
  stderr: z.string().default(""),
  code: z.number().nullable().optional(),
  signal: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});

export const pistonExecuteResponseSchema = z.object({
  language: z.string().optional(),
  version: z.string().optional(),
  run: processResultSchema.optional(),
  compile: processResultSchema.optional(),
  message: z.string().optional(),
});

export type PistonExecuteResponse = z.infer<typeof pistonExecuteResponseSchema>;

type HarnessPayload = {
  status: "completed" | "syntax_error" | "runtime_error";
  testResults?: CodeRunTestResult[];
  error?: string;
};

export function normalizePistonResponse(
  response: PistonExecuteResponse,
  durationMs: number,
): CodeRunResult {
  const compileError = response.compile?.stderr || response.compile?.message;
  if (compileError) {
    return unavailableOrError("syntax_error", compileError, durationMs, response);
  }

  const run = response.run;
  if (!run) {
    return unavailableOrError(
      "runner_error",
      response.message ?? "Piston returned no run result.",
      durationMs,
      response,
      "piston_unavailable",
    );
  }

  const markerIndex = run.stdout.lastIndexOf(PISTON_RESULT_MARKER);
  if (markerIndex < 0) {
    const timeout = /time|signal|killed/i.test(
      `${run.status ?? ""} ${run.message ?? ""} ${run.stderr}`,
    );
    return unavailableOrError(
      timeout ? "timeout" : "runtime_error",
      run.stderr || run.message || "The Python harness did not return a result.",
      durationMs,
      response,
    );
  }

  const payloadText = run.stdout.slice(markerIndex + PISTON_RESULT_MARKER.length).trim();
  let payload: HarnessPayload;
  try {
    payload = JSON.parse(payloadText) as HarnessPayload;
  } catch {
    return unavailableOrError(
      "runner_error",
      "Piston returned an unreadable harness result.",
      durationMs,
      response,
    );
  }

  const testResults = payload.testResults ?? [];
  if (payload.status !== "completed") {
    return {
      evidenceKind: "executed",
      status: payload.status,
      passedCount: testResults.filter((result) => result.passed).length,
      failedCount: testResults.filter((result) => !result.passed).length,
      totalCount: testResults.length,
      durationMs,
      stdout: run.stdout.slice(0, markerIndex).trim(),
      stderr: payload.error ?? run.stderr,
      firstFailedCase: testResults.find((result) => !result.passed),
      testResults,
      providerUsed: "piston",
      rawResult: response,
    };
  }

  const passedCount = testResults.filter((result) => result.passed).length;
  const failedCount = testResults.length - passedCount;
  return {
    evidenceKind: "executed",
    status: failedCount === 0 ? "passed_visible_tests" : "failed",
    passedCount,
    failedCount,
    totalCount: testResults.length,
    durationMs,
    stdout: run.stdout.slice(0, markerIndex).trim(),
    stderr: run.stderr,
    firstFailedCase: testResults.find((result) => !result.passed),
    testResults,
    providerUsed: "piston",
    rawResult: response,
  };
}

function unavailableOrError(
  status: CodeRunResult["status"],
  stderr: string,
  durationMs: number,
  rawResult: unknown,
  providerUsed: CodeRunResult["providerUsed"] = "piston",
): CodeRunResult {
  return {
    evidenceKind: providerUsed === "piston" ? "executed" : "unavailable",
    status,
    passedCount: 0,
    failedCount: 0,
    totalCount: 0,
    durationMs,
    stdout: "",
    stderr,
    testResults: [],
    providerUsed,
    rawResult,
  };
}
