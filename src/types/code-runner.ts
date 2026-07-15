import { z } from "zod";

export const codeRunnerLanguageSchema = z.literal("Python");
export type CodeRunnerLanguage = z.infer<typeof codeRunnerLanguageSchema>;

export const codeRunStatusSchema = z.enum([
  "passed_visible_tests",
  "failed",
  "syntax_error",
  "runtime_error",
  "timeout",
  "no_tests",
  "runner_error",
  "empty_code",
  "unsupported_language",
]);

export const codeRunTestCaseSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  input: z.record(z.string(), z.unknown()),
  expected: z.unknown(),
  source: z.enum(["public_visible", "custom"]).default("custom"),
});

export const codeRunTestResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  input: z.unknown().optional(),
  expected: z.unknown().optional(),
  actual: z.unknown().optional(),
  passed: z.boolean(),
  error: z.string().optional(),
  stdout: z.string().default(""),
  stderr: z.string().default(""),
});

export type CodeRunTestCase = z.infer<typeof codeRunTestCaseSchema>;
export type CodeRunTestResult = z.infer<typeof codeRunTestResultSchema>;

export type CodeRunResult = {
  evidenceKind: "executed" | "unavailable";
  status: z.infer<typeof codeRunStatusSchema>;
  passedCount: number;
  failedCount: number;
  totalCount: number;
  durationMs?: number;
  stdout: string;
  stderr: string;
  firstFailedCase?: CodeRunTestResult;
  testResults: CodeRunTestResult[];
  providerUsed: "piston" | "piston_unavailable";
  rawResult?: unknown;
};
