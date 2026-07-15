import prisma from "@/server/db/prisma";
import { getDefaultFtsStore } from "@/server/memory/store/fts-store";

const store = getDefaultFtsStore();
const [episodes, facts, notes] = await Promise.all([
  prisma.memoryEpisode.findMany(),
  prisma.l2MemoryFact.findMany({ where: { status: "active" } }),
  prisma.knowledgeNote.findMany({ where: { status: "active" } }),
]);

for (const episode of episodes) {
  store.indexMemoryDocument({ kind: "episode", refId: episode.id, content: `${episode.title}\n${episode.summary}` });
}
for (const fact of facts) {
  store.indexMemoryDocument({ kind: "fact", refId: fact.id, content: `${fact.tag}\n${fact.label ?? ""}\n${fact.value ?? ""}` });
}
for (const note of notes) {
  store.indexMemoryDocument({ kind: "knowledge_note", refId: note.id, content: `${note.title}\n${note.snippet}\n${note.whenToUse}` });
}

store.close();
await prisma.$disconnect();
console.log(`Rebuilt FTS5 index: ${episodes.length} episodes, ${facts.length} facts, ${notes.length} notes.`);
