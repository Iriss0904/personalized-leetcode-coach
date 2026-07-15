import type { PrismaClient } from "@prisma/client";
export async function getMistakeHistoryChatTool(_: unknown, context: { prisma: PrismaClient; userId: string; problemId: string }) {
  const rows = await context.prisma.mistakeBookEntry.findMany({
    where: { userId: context.userId, problemId: context.problemId },
    orderBy: { lastSavedAt: "desc" },
    take: 5,
    select: {
      title: true,
      guideMarkdown: true,
      selfCheckQuestion: true,
      tags: true,
      lastSavedAt: true,
    },
  });
  return {
    tool: "get_mistake_history" as const,
    ok: true,
    message: `${rows.length} local entries`,
    data: rows.map((row) => ({
      ...row,
      tags: parseStringArray(row.tags),
    })),
  };
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
