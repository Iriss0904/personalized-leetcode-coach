import type { CodeRunnerInput } from "./code-runner.types";
import { createPistonRunnerProvider } from "./piston-runner";

export async function runCodeWithTests(input: CodeRunnerInput) {
  return createPistonRunnerProvider().run(input);
}
