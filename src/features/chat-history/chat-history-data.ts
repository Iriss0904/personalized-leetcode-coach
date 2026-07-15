import { localUserHandle, publicDefaultProfile } from "@/features/onboarding/profile-defaults";
import prisma from "@/server/db/prisma";

export type ChatHistorySession = {
  id: string;
  updatedAt: Date;
  problem: { slug: string; title: string; leetcodeNumber: number; difficulty: string };
  messages: Array<{ id: string; role: string; contentMarkdown: string; sequence: number; createdAt: Date }>;
  toolEvents: Array<{
    id: string;
    type: "tool_call" | "tool_result";
    toolName: string;
    ok: boolean | null;
    occurredAt: Date;
  }>;
};

export async function getChatHistoryPageData(sessionId?: string) {
  const user = await prisma.user.upsert({ where: { handle: localUserHandle }, update: {}, create: { handle: localUserHandle }, include: { profile: true } });
  const sessions = await prisma.chatSession.findMany({
    where: { userId: user.id },
    include: {
      problem: true,
      messages: { orderBy: { sequence: "asc" } },
      l1MemoryEvents: {
        where: { eventType: { in: ["tool_call", "tool_result"] } },
        orderBy: { occurredAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  const rows: ChatHistorySession[] = sessions.map((session) => ({
    id: session.id,
    updatedAt: session.updatedAt,
    problem: {
      slug: session.problem.slug,
      title: session.problem.title,
      leetcodeNumber: session.problem.leetcodeNumber,
      difficulty: session.problem.difficulty,
    },
    messages: session.messages.map(({ id, role, contentMarkdown, sequence, createdAt }) => ({ id, role, contentMarkdown, sequence, createdAt })),
    toolEvents: session.l1MemoryEvents.map((event) => {
      const payload = parseEvent(event.eventJson);
      const result = payload.result && typeof payload.result === "object" ? payload.result as Record<string, unknown> : null;
      return {
        id: event.id,
        type: event.eventType as "tool_call" | "tool_result",
        toolName: typeof payload.toolName === "string" ? payload.toolName : "unknown_tool",
        ok: typeof result?.ok === "boolean" ? result.ok : null,
        occurredAt: event.occurredAt,
      };
    }),
  }));
  return { displayName: user.profile?.displayName ?? publicDefaultProfile.displayName, sessions: rows, selected: rows.find(({ id }) => id === sessionId) ?? rows[0] ?? null };
}

function parseEvent(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}
