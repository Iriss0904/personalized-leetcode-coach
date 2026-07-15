import { z } from "zod";
import { localUserHandle } from "@/features/onboarding/profile-defaults";
import prisma from "@/server/db/prisma";

const schema = z.object({ problemSlug: z.string().min(1) });
export async function clearCoachChatHistory(input: unknown) {
  const { problemSlug } = schema.parse(input);
  const user = await prisma.user.findUnique({ where: { handle: localUserHandle } });
  const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
  if (!user || !problem) return { ok: true, cleared: 0 };
  const session = await prisma.chatSession.findUnique({ where: { userId_problemId: { userId: user.id, problemId: problem.id } } });
  if (!session) return { ok: true, cleared: 0 };
  const cleared = await prisma.chatMessage.count({ where: { sessionId: session.id } });
  await prisma.$transaction([
    prisma.chatMessage.deleteMany({ where: { sessionId: session.id } }),
    prisma.l1MemoryEvent.deleteMany({
      where: {
        chatSessionId: session.id,
        eventType: { in: ["chat_user_message", "chat_reply", "tool_call", "tool_result"] },
      },
    }),
    prisma.chatSession.update({ where: { id: session.id }, data: { clearedAt: new Date(), clearedBeforeSequence: 0 } }),
  ]);
  return { ok: true, cleared };
}
