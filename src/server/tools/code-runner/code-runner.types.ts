import type { PublicHot150Problem } from "@/data/hot150/local-run-types";
import type {
  CodeRunnerLanguage,
  CodeRunResult,
  CodeRunTestCase,
} from "@/types/code-runner";

export type CodeRunnerInput = {
  problem: PublicHot150Problem;
  language: CodeRunnerLanguage;
  code: string;
  testCases: CodeRunTestCase[];
  limits?: {
    runTimeoutMs?: number;
    memoryBytes?: number;
  };
};

export interface CodeRunnerProvider {
  run(input: CodeRunnerInput): Promise<CodeRunResult>;
}
