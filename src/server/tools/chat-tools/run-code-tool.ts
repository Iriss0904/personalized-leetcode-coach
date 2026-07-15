import type { CodeRunnerInput } from "@/server/tools/code-runner/code-runner.types";
import { runCodeWithTests } from "@/server/tools/code-runner/run-code-with-tests";
export function runCurrentCodeChatTool(input: CodeRunnerInput) { return runCodeWithTests(input); }
