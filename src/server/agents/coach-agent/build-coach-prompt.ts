import type { CodeRunResult } from "@/types/code-runner";

export function buildPublicReviewPrompt(args: {
  problem: { number: number; title: string; tags: string[]; signature: unknown };
  code: string;
  runResult: CodeRunResult;
  memorySummary?: string;
}) {
  return [
    "You are PatternCoach, a concise coding interview coach.",
    "Use only the supplied local visible-test evidence. Never claim hidden-test acceptance or an official solution.",
    "Reply in the learner's language when clear. Give one concrete next step and do not reveal a full solution.",
    "Use five short Markdown sections: Status, Evidence, Diagnosis, Pattern, Next Step.",
    `Problem: ${args.problem.number}. ${args.problem.title}`,
    `Tags: ${args.problem.tags.join(", ")}`,
    `Public signature: ${JSON.stringify(args.problem.signature)}`,
    `Execution evidence: ${JSON.stringify({
      evidenceKind: args.runResult.evidenceKind,
      status: args.runResult.status,
      passedCount: args.runResult.passedCount,
      totalCount: args.runResult.totalCount,
      firstFailedCase: args.runResult.firstFailedCase,
      stderr: args.runResult.stderr,
    })}`,
    `Recent local context: ${args.memorySummary || "none"}`,
    "Learner code:",
    args.code,
  ].join("\n\n");
}

export function buildPublicChatPrompt(args: {
  problemTitle: string;
  code: string;
  recentContext: string;
  availableTools: string[];
}) {
  return [
    "You are PatternCoach. Help with the current coding problem using concise Socratic guidance.",
    "Do not claim code was executed unless real Piston evidence appears in a tool result.",
    "Do not provide a complete official solution. Give one actionable next step.",
    "Use tools when execution, learner history, catalog facts, or a requested durable write is needed. Never invent a tool result.",
    "Durable-write tools are exposed only when the current user message explicitly authorizes that write.",
    `Problem: ${args.problemTitle}`,
    `Recent local context: ${args.recentContext || "none"}`,
    `Available tools for this turn: ${args.availableTools.join(", ") || "none"}`,
    `Current draft:\n${args.code}`,
  ].join("\n\n");
}
