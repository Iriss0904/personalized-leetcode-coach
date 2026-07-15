import { randomUUID } from "node:crypto";
import { publicHot150Bank } from "@/data/hot150/local-bank.public";
import { localUserHandle } from "@/features/onboarding/profile-defaults";
import prisma from "@/server/db/prisma";
import {
  requestPublicCoachTurn,
  type PublicCoachMessage,
} from "@/server/llm/client";
import { sanitizeToolProtocolText } from "@/server/llm/tool-protocol-leak";
import {
  publicChatToolsFor,
  type ChatToolName,
} from "@/server/tools/chat-tools/chat-tool-contracts";
import { dispatchPublicChatTool } from "@/server/tools/chat-tools/chat-tool-dispatch";
import { PUBLIC_CHAT_TOOL_MAX_STEPS } from "@/server/tools/chat-tools/chat-tool-runtime";
import { buildPublicTurnToolPlan } from "@/server/tools/chat-tools/turn-tool-plan";
import type { CodeRunTestCase } from "@/types/code-runner";
import { buildPublicChatPrompt } from "./build-coach-prompt";
import { resolvePublicChatIntent } from "./chat-intent-policy";
import { localCoachChat } from "./local-coach-provider";
import { guardPublicCoachReply } from "./product-invariant-guard";

export type PublicChatInput = {
  problemSlug: string;
  message: string;
  code: string;
  language: "Python";
  testCases: CodeRunTestCase[];
};

type PublicToolTrace = {
  toolCallId: string;
  name: ChatToolName;
  result: unknown;
};

type ChatToolContext = {
  input: PublicChatInput;
  problem: (typeof publicHot150Bank.problems)[number];
  userId: string;
  problemId: string;
  chatSessionId: string;
  authorization: ReturnType<typeof resolvePublicChatIntent>["authorization"];
  toolPlan: ChatToolName[];
  toolTrace: PublicToolTrace[];
};

export async function chatReply(input: PublicChatInput) {
  const problem = publicHot150Bank.problems.find(
    ({ slug }) => slug === input.problemSlug,
  );
  if (!problem) throw new Error("Unknown Hot-150 problem.");
  const user = await prisma.user.upsert({
    where: { handle: localUserHandle },
    update: {},
    create: { handle: localUserHandle },
  });
  const problemRow = await prisma.problem.findUniqueOrThrow({
    where: { slug: problem.slug },
  });
  const session = await prisma.chatSession.upsert({
    where: {
      userId_problemId: { userId: user.id, problemId: problemRow.id },
    },
    update: { isActive: true },
    create: {
      userId: user.id,
      problemId: problemRow.id,
      title: problem.title,
      primaryLanguage: "Python",
    },
  });
  const { authorization } = resolvePublicChatIntent(input.message);
  const toolPlan = buildPublicTurnToolPlan(authorization);
  const sequence = await prisma.chatMessage.count({
    where: { sessionId: session.id },
  });
  const userMessage = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "user",
      contentMarkdown: input.message,
      sequence: sequence + 1,
    },
  });
  await appendChatEvent({
    userId: user.id,
    problemId: problemRow.id,
    chatSessionId: session.id,
    eventType: "chat_user_message",
    content: input.message,
    eventJson: { sequence: userMessage.sequence },
  });

  const [recentEpisodes, focusedFacts, profile, recentMessages] = await Promise.all([
    prisma.memoryEpisode.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { summary: true },
    }),
    prisma.l2MemoryFact.findMany({
      where: { userId: user.id, status: "active" },
      orderBy: { lastSeenAt: "desc" },
      take: 5,
      select: { factType: true, tag: true, value: true },
    }),
    prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: {
        strongPatterns: true,
        weakPatterns: true,
        outputPreferences: true,
        explanationStyle: true,
      },
    }),
    prisma.chatMessage.findMany({
      where: {
        sessionId: session.id,
        sequence: { gt: session.clearedBeforeSequence },
      },
      orderBy: { sequence: "desc" },
      take: 12,
      select: { role: true, contentMarkdown: true },
    }),
  ]);
  const systemPrompt = buildPublicChatPrompt({
    problemTitle: problem.title,
    code: input.code,
    recentContext: [
      profile
        ? `Profile: strong=${profile.strongPatterns}; weak=${profile.weakPatterns}; output=${profile.outputPreferences}; style=${profile.explanationStyle}`
        : "",
      focusedFacts
        .map(({ factType, tag, value }) => `${factType}:${tag}:${value ?? ""}`)
        .join(" | "),
      recentEpisodes.map(({ summary }) => summary).join(" | "),
    ]
      .filter(Boolean)
      .join("\n"),
    availableTools: toolPlan,
  });
  const messages: PublicCoachMessage[] = [
    { role: "system", content: systemPrompt },
    ...recentMessages
      .reverse()
      .filter(
        (message): message is {
          role: "user" | "assistant";
          contentMarkdown: string;
        } => message.role === "user" || message.role === "assistant",
      )
      .map((message) => ({
        role: message.role,
        content: message.contentMarkdown,
      })),
  ];
  const toolTrace: PublicToolTrace[] = [];
  const toolContext: ChatToolContext = {
    input,
    problem,
    userId: user.id,
    problemId: problemRow.id,
    chatSessionId: session.id,
    authorization,
    toolPlan,
    toolTrace,
  };
  const external = await runExternalToolLoop({ messages, ...toolContext });
  let coachReply: string;
  let coachProvider: "external" | "local";
  let toolIterations: number;
  let toolBudgetReached: boolean;

  if (external) {
    coachReply = external.coachReply;
    coachProvider = "external";
    toolIterations = external.toolIterations;
    toolBudgetReached = external.toolBudgetReached;
  } else {
    const local = await runLocalRequestedTools(toolContext);
    coachReply = [
      localCoachChat(problem.title, input.message),
      ...local.map((trace) => formatLocalToolResult(trace)),
    ]
      .filter(Boolean)
      .join("\n\n");
    coachProvider = "local";
    toolIterations = local.length;
    toolBudgetReached = false;
  }

  coachReply = guardPublicCoachReply(
    sanitizeToolProtocolText(coachReply).text,
  );

  const assistantMessage = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "assistant",
      contentMarkdown: coachReply,
      metadataJson: JSON.stringify({
        coachProvider,
        toolIterations,
        toolNames: toolTrace.map(({ name }) => name),
      }),
      sequence: sequence + 2,
    },
  });
  await appendChatEvent({
    userId: user.id,
    problemId: problemRow.id,
    chatSessionId: session.id,
    eventType: "chat_reply",
    content: coachReply,
    eventJson: { sequence: assistantMessage.sequence, coachProvider },
  });

  return {
    chatSessionId: session.id,
    userMessageId: userMessage.id,
    assistantMessageId: assistantMessage.id,
    coachReply,
    coachProvider,
    persisted: true,
    toolTrace,
    toolIterations,
    toolBudgetReached,
    actionOutcomes: toolTrace
      .filter(({ name }) => isDurableWriteTool(name))
      .map(({ name, result }) => actionOutcome(name, result)),
  };
}

async function runExternalToolLoop(
  args: ChatToolContext & { messages: PublicCoachMessage[] },
) {
  const tools = publicChatToolsFor(args.toolPlan);
  let toolIterations = 0;
  let toolBudgetReached = false;

  while (true) {
    const turn = await requestPublicCoachTurn({
      messages: args.messages,
      tools: toolIterations < PUBLIC_CHAT_TOOL_MAX_STEPS ? tools : undefined,
    });
    if (!turn) return null;
    if (turn.toolCalls.length === 0) {
      return {
        coachReply:
          turn.content ??
          "I could not produce a final Coach response from the available tool evidence.",
        toolIterations,
        toolBudgetReached,
      };
    }

    const remaining = PUBLIC_CHAT_TOOL_MAX_STEPS - toolIterations;
    if (remaining <= 0) {
      return {
        coachReply:
          turn.content ??
          "The Coach reached the public tool budget. Use the recorded evidence above and take one small next step.",
        toolIterations,
        toolBudgetReached: true,
      };
    }
    const calls = turn.toolCalls.slice(0, remaining);
    if (calls.length < turn.toolCalls.length) toolBudgetReached = true;
    args.messages.push({
      role: "assistant",
      content: turn.content,
      tool_calls: calls.map((call) => ({
        id: call.id,
        type: "function" as const,
        function: { name: call.name, arguments: call.arguments },
      })),
    });

    for (const call of calls) {
      await executeAndRecordTool({ ...args, call });
      const trace = args.toolTrace.at(-1);
      args.messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(trace?.result ?? { ok: false }),
      });
      toolIterations += 1;
    }
  }
}

async function runLocalRequestedTools(args: ChatToolContext) {
  const calls: Array<{ id: string; name: ChatToolName; arguments: string }> = [];
  const text = args.input.message;
  if (/(?:run|execute|test|运行|执行|跑一下|测试)/iu.test(text)) {
    calls.push(localCall("run_current_code", {}));
  } else if (/(?:hint|提示|线索)/iu.test(text)) {
    calls.push(localCall("get_algorithm_hint", {}));
  } else if (/(?:以前|历史|mistake history)/iu.test(text)) {
    calls.push(localCall("get_mistake_history", {}));
  }
  if (args.authorization.durableWrites.note_memory) {
    calls.push(
      localCall("note_memory", {
        tag: "user-request",
        value: text.slice(0, 500),
      }),
    );
  }
  if (args.authorization.durableWrites.save_knowledge_note) {
    calls.push(
      localCall("save_knowledge_note", {
        conceptKey: `chat-${args.problem.slug}`,
        title: args.problem.title,
        snippet: text.slice(0, 500),
        whenToUse: `While practicing ${args.problem.title}`,
        category: "general",
      }),
    );
  }
  if (args.authorization.durableWrites.save_mistake_book_entry) {
    calls.push(
      localCall("save_mistake_book_entry", {
        title: args.problem.title,
        guideMarkdown: text.slice(0, 1_000),
        tags: args.problem.tags,
      }),
    );
  }
  for (const call of calls.slice(0, PUBLIC_CHAT_TOOL_MAX_STEPS)) {
    await executeAndRecordTool({ ...args, call });
  }
  return args.toolTrace;
}

async function executeAndRecordTool(
  args: ChatToolContext & {
    call: { id: string; name: string; arguments: string };
  },
) {
  const parsedArguments = parseToolArguments(args.call.arguments);
  await appendChatEvent({
    userId: args.userId,
    problemId: args.problemId,
    chatSessionId: args.chatSessionId,
    eventType: "tool_call",
    eventJson: {
      toolCallId: args.call.id,
      toolName: args.call.name,
      arguments: parsedArguments,
    },
  });
  let result: unknown;
  let name: ChatToolName;
  try {
    if (!args.toolPlan.includes(args.call.name as ChatToolName)) {
      throw new Error(`Tool ${args.call.name} is not authorized for this turn.`);
    }
    result = await dispatchPublicChatTool(
      { name: args.call.name, arguments: parsedArguments },
      {
        prisma,
        userId: args.userId,
        problemId: args.problemId,
        problemSlug: args.problem.slug,
        chatSessionId: args.chatSessionId,
        toolCallId: args.call.id,
        authorization: args.authorization,
        problem: args.problem,
        code: args.input.code,
        testCases: args.input.testCases,
      },
    );
    name = args.call.name as ChatToolName;
  } catch (error) {
    name = args.call.name as ChatToolName;
    result = {
      tool: args.call.name,
      ok: false,
      message:
        error instanceof Error ? error.message : "Public tool execution failed.",
    };
  }
  args.toolTrace.push({ toolCallId: args.call.id, name, result });
  await appendChatEvent({
    userId: args.userId,
    problemId: args.problemId,
    chatSessionId: args.chatSessionId,
    eventType: "tool_result",
    eventJson: {
      toolCallId: args.call.id,
      toolName: name,
      result,
    },
  });
}

function localCall(name: ChatToolName, args: unknown) {
  return {
    id: `local-${name}-${randomUUID()}`,
    name,
    arguments: JSON.stringify(args),
  };
}

function parseToolArguments(value: string) {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function formatLocalToolResult(trace: PublicToolTrace) {
  const result = trace.result as { message?: string } | undefined;
  return result?.message ? `**${trace.name}:** ${result.message}` : "";
}

function isDurableWriteTool(name: ChatToolName) {
  return (
    name === "note_memory" ||
    name === "save_knowledge_note" ||
    name === "save_mistake_book_entry"
  );
}

function actionOutcome(name: ChatToolName, value: unknown) {
  const result = value as {
    ok?: boolean;
    message?: string;
    data?: { noteId?: string; entryId?: string; factId?: string };
  };
  return {
    toolName: name,
    displayName: name.replaceAll("_", " "),
    status: result.ok ? ("completed" as const) : ("failed" as const),
    message: result.message ?? "Tool finished.",
    recordId:
      result.data?.noteId ?? result.data?.entryId ?? result.data?.factId,
  };
}

async function appendChatEvent(args: {
  userId: string;
  problemId: string;
  chatSessionId: string;
  eventType: string;
  eventJson: Record<string, unknown>;
  content?: string;
}) {
  await prisma.l1MemoryEvent.create({
    data: {
      userId: args.userId,
      problemId: args.problemId,
      chatSessionId: args.chatSessionId,
      eventType: args.eventType,
      eventJson: JSON.stringify(args.eventJson),
      content: args.content,
      source: "public_coach_chat",
    },
  });
}
