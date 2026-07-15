import { createHash } from "node:crypto";
import type { CodeRunnerLanguage } from "@/types/code-runner";

export function hashCodeForRun(args: { language: CodeRunnerLanguage; code: string }) {
  return digest(`${args.language}\0${args.code}`);
}

export function fingerprintCodeForExecution(args: { language: CodeRunnerLanguage; code: string }) {
  return `execfp:v1:${digest(`${args.language}\0${normalizePython(args.code)}`)}`;
}

export function hashSelectedTestSuite(testCaseIds: string[]) {
  return digest(JSON.stringify([...testCaseIds].sort()));
}

function digest(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function normalizePython(code: string) {
  return code
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[\t ]+$/g, ""))
    .filter((line) => line.trim().length > 0 && !line.trimStart().startsWith("#"))
    .join("\n");
}
