import type { PrismaClient } from "@prisma/client";
import type { PublicHot150Problem } from "@/data/hot150/local-run-types";
import { fingerprintCodeForExecution, hashCodeForRun } from "@/server/code/code-hash";
import type { CodeRunTestCase } from "@/types/code-runner";
import { chatToolArgSchemas, chatToolNameSchema } from "./chat-tool-contracts";
import { findPracticeProblemChatTool } from "./find-practice-problem-tool";
import { getAlgorithmHintChatTool } from "./get-algorithm-hint-tool";
import { getMistakeHistoryChatTool } from "./get-mistake-history-tool";
import { noteMemoryChatTool } from "./note-memory-tool";
import { recallMemoryChatTool } from "./recall-memory-tool";
import { runCurrentCodeChatTool } from "./run-code-tool";
import { saveKnowledgeNoteChatTool } from "./save-knowledge-note-tool";
import { saveMistakeBookEntryChatTool } from "./save-mistake-book-entry-tool";
import { assertDurableWriteAuthorized, type TurnAuthorization } from "./turn-authorization";

export type ChatToolExecutionContext = {
  prisma: PrismaClient;
  userId: string;
  problemId: string;
  problemSlug: string;
  chatSessionId: string;
  toolCallId: string;
  authorization: TurnAuthorization;
  problem: PublicHot150Problem;
  code: string;
  testCases: CodeRunTestCase[];
};

export async function dispatchPublicChatTool(
  call: { name: string; arguments: unknown },
  context: ChatToolExecutionContext,
) {
  const name = chatToolNameSchema.parse(call.name);
  if (name === "note_memory" || name === "save_knowledge_note" || name === "save_mistake_book_entry") assertDurableWriteAuthorized(context.authorization, name);

  switch (name) {
    case "run_current_code": {
      chatToolArgSchemas.run_current_code.parse(call.arguments);
      const result = await runCurrentCodeChatTool({
        problem: context.problem,
        language: "Python",
        code: context.code,
        testCases: context.testCases,
      });
      await context.prisma.runEvidence.create({
        data: {
          chatSessionId: context.chatSessionId,
          source: "chat_tool",
          toolCallId: context.toolCallId,
          codeHash: hashCodeForRun({ language: "Python", code: context.code }),
          executionFingerprint: fingerprintCodeForExecution({
            language: "Python",
            code: context.code,
          }),
          evidenceKind: result.evidenceKind,
          status: result.status,
          passedCount: result.passedCount,
          failedCount: result.failedCount,
          durationMs: result.durationMs,
          stdout: result.stdout,
          stderr: result.stderr,
          actualOutput: stringifyValue(result.firstFailedCase?.actual),
          expectedOutput: stringifyValue(result.firstFailedCase?.expected),
          firstFailedCaseJson: result.firstFailedCase
            ? JSON.stringify(result.firstFailedCase)
            : null,
          rawResultJson: JSON.stringify(result),
        },
      });
      return {
        tool: name,
        ok: result.evidenceKind === "executed",
        message:
          result.evidenceKind === "executed"
            ? `Piston returned ${result.status}: ${result.passedCount}/${result.totalCount} visible tests passed.`
            : "Piston execution evidence is unavailable.",
        data: {
          evidenceKind: result.evidenceKind,
          providerUsed: result.providerUsed,
          status: result.status,
          passedCount: result.passedCount,
          failedCount: result.failedCount,
          totalCount: result.totalCount,
          stdout: result.stdout,
          stderr: result.stderr,
          firstFailedCase: result.firstFailedCase,
        },
      };
    }
    case "find_practice_problem":
      return findPracticeProblemChatTool(
        chatToolArgSchemas.find_practice_problem.parse(call.arguments),
      );
    case "get_algorithm_hint":
      return getAlgorithmHintChatTool(
        chatToolArgSchemas.get_algorithm_hint.parse(call.arguments),
        context,
      );
    case "get_mistake_history":
      return getMistakeHistoryChatTool(
        chatToolArgSchemas.get_mistake_history.parse(call.arguments),
        context,
      );
    case "recall_memory":
      return recallMemoryChatTool(
        chatToolArgSchemas.recall_memory.parse(call.arguments),
        context,
      );
    case "note_memory":
      return {
        tool: name,
        ok: true,
        message: "Learner preference saved locally.",
        data: await noteMemoryChatTool(
          chatToolArgSchemas.note_memory.parse(call.arguments),
          context,
        ),
      };
    case "save_knowledge_note": {
      const result = await saveKnowledgeNoteChatTool(
        chatToolArgSchemas.save_knowledge_note.parse(call.arguments),
        context,
      );
      return {
        tool: name,
        ok: result.saved,
        message: result.saved
          ? "Knowledge Handbook note saved locally."
          : result.reason,
        data: result,
      };
    }
    case "save_mistake_book_entry": {
      const result = await saveMistakeBookEntryChatTool(
        chatToolArgSchemas.save_mistake_book_entry.parse(call.arguments),
        context,
      );
      return {
        tool: name,
        ok: result.saved,
        message: result.saved
          ? "Mistake Book entry saved locally."
          : result.reason,
        data: {
          ...result,
          ...(result.saved ? { problemSlug: context.problemSlug } : {}),
        },
      };
    }
    default:
      return assertNever(name);
  }
}

function stringifyValue(value: unknown) {
  return value === undefined ? null : JSON.stringify(value).slice(0, 4_000);
}

function assertNever(value: never): never {
  throw new Error(`Unsupported public chat tool: ${String(value)}`);
}
