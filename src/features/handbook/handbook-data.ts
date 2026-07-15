import type { PrismaClient } from "@prisma/client";
import { localUserHandle, publicDefaultProfile } from "@/features/onboarding/profile-defaults";
import defaultPrisma from "@/server/db/prisma";
import { listActiveKnowledgeNotes } from "@/server/memory/store/knowledge-note-store";
import { buildHandbookMarkdown, type HandbookNote } from "./handbook-markdown";

export type HandbookData = {
  displayName: string;
  notes: HandbookNote[];
  markdown: string;
};

export async function loadHandbookData(
  prisma: PrismaClient = defaultPrisma,
): Promise<HandbookData> {
  const user = await prisma.user.upsert({
    where: { handle: localUserHandle },
    update: {},
    create: { handle: localUserHandle },
    include: { profile: true },
  });
  const rows = await listActiveKnowledgeNotes(prisma, user.id);
  const notes = rows.map(
    (row): HandbookNote => ({
      id: row.id,
      conceptKey: row.conceptKey,
      title: row.title,
      snippet: row.snippet,
      whenToUse: row.whenToUse,
      category: row.category,
      lookupCount: row.lookupCount,
    }),
  );

  return { displayName: user.profile?.displayName ?? publicDefaultProfile.displayName, notes, markdown: buildHandbookMarkdown(notes, new Date()) };
}
