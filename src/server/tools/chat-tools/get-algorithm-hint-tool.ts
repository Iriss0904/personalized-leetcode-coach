import type { PrismaClient } from "@prisma/client";
import { publicAlgorithmHintLevels } from "./algorithm-hints";

export async function getAlgorithmHintChatTool(
  _: unknown,
  context: { prisma: PrismaClient; userId: string; problemId: string },
) {
  const existing = await context.prisma.algorithmHintProgress.findUnique({
    where: {
      userId_problemId: {
        userId: context.userId,
        problemId: context.problemId,
      },
    },
  });
  const level = Math.min(3, (existing?.currentLevel ?? 0) + 1);
  await context.prisma.algorithmHintProgress.upsert({
    where: {
      userId_problemId: {
        userId: context.userId,
        problemId: context.problemId,
      },
    },
    update: { currentLevel: level },
    create: {
      userId: context.userId,
      problemId: context.problemId,
      currentLevel: level,
    },
  });
  return {
    tool: "get_algorithm_hint" as const,
    ok: true,
    message: publicAlgorithmHintLevels[level - 1],
    data: { level },
  };
}
