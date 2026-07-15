import type { PublicHot150Problem, PublicVisibleTest } from "@/data/hot150/local-run-types";
import type { CodeRunResult } from "@/types/code-runner";

export type WorkbenchLanguage = "Python";
export type WorkbenchProblem = PublicHot150Problem;
export type WorkbenchTestCase = PublicVisibleTest & { source: "public_visible" | "custom" };

export type WorkbenchCatalogEntry = Pick<
  PublicHot150Problem,
  "number" | "slug" | "title" | "difficulty" | "section" | "tags"
>;

export type WorkbenchInitialData = {
  displayName: string;
  coachProviderStatus: "external" | "local" | "incomplete";
  pistonHealthy: boolean;
  catalog: WorkbenchCatalogEntry[];
  problem: WorkbenchProblem;
  starterCode: string;
  draftCode: string;
  customTests: WorkbenchTestCase[];
  selectedTestCaseIds: string[];
  chatMessages: Array<{ id: string; role: "user" | "assistant"; text: string }>;
  planItemId: string | null;
};

export type WorkbenchRunResponse = {
  ok: true;
  persisted: boolean;
  runResult: CodeRunResult;
};

export type WorkbenchReviewResponse = WorkbenchRunResponse & {
  coachReply: string;
  coachProvider?: "external" | "local";
  reviewAttemptId?: string;
  problemHistoryId?: string;
};

export type WorkbenchChatResponse = {
  ok: true;
  chatSessionId?: string;
  userMessageId?: string;
  assistantMessageId?: string;
  coachReply: string;
  coachProvider: "external" | "local";
  persisted: boolean;
  toolTrace?: Array<{
    toolCallId: string;
    name: string;
    result: unknown;
  }>;
  toolIterations?: number;
  toolBudgetReached?: boolean;
  actionOutcomes?: Array<{
    toolName: string;
    displayName: string;
    status: "completed" | "failed" | "unfulfilled";
    message: string;
    recordId?: string;
  }>;
};
