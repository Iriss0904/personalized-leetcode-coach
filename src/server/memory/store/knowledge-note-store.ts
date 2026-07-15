import type { PrismaClient } from "@prisma/client";
import { getDefaultFtsStore, type FtsStore } from "./fts-store";

export const HANDBOOK_HOME_CAP = 4;
export const KNOWLEDGE_NOTE_CATEGORIES = ["python_api", "algo_template", "stdlib", "general"] as const;
export type KnowledgeNoteCategory = (typeof KNOWLEDGE_NOTE_CATEGORIES)[number];
export type CoachNoteInput = { conceptKey: string; title: string; snippet: string; whenToUse: string; category: string };

export function normalizeKnowledgeConceptKey(value: string, category?: string) {
  return `${category ?? "general"}:${value}`.toLowerCase().trim().replace(/[^a-z0-9:_-]+/g, "-");
}
export function isCleanCoachKnowledgeNote(note: Pick<CoachNoteInput, "snippet" | "whenToUse">) {
  return Boolean(note.snippet.trim() && note.whenToUse.trim());
}
export async function listActiveKnowledgeNotes(prisma: PrismaClient, userId: string) {
  return prisma.knowledgeNote.findMany({ where: { userId, status: "active" }, orderBy: { lastNeededAt: "desc" } });
}
export async function loadHandbookHomeCard(prisma: PrismaClient, userId: string) {
  return prisma.knowledgeNote.findMany({ where: { userId, status: "active" }, orderBy: [{ lookupCount: "desc" }, { lastNeededAt: "desc" }], take: HANDBOOK_HOME_CAP });
}
export async function createKnowledgeNote(prisma: PrismaClient, args: { userId: string; note: CoachNoteInput; ftsStore?: FtsStore }) {
  const note = await prisma.knowledgeNote.create({ data: { userId: args.userId, ...args.note, conceptKey: normalizeKnowledgeConceptKey(args.note.conceptKey, args.note.category), source: "user", userEdited: true } });
  indexKnowledgeNote(args.ftsStore, note);
  return note;
}
export async function updateKnowledgeNote(prisma: PrismaClient, args: { userId: string; noteId: string; patch: Partial<Omit<CoachNoteInput, "conceptKey">>; ftsStore?: FtsStore }) {
  const note = await prisma.knowledgeNote.update({ where: { id: args.noteId, userId: args.userId }, data: { ...args.patch, userEdited: true } });
  indexKnowledgeNote(args.ftsStore, note);
  return note;
}
export async function archiveKnowledgeNote(prisma: PrismaClient, args: { userId: string; noteId: string; ftsStore?: FtsStore }) {
  const note = await prisma.knowledgeNote.update({ where: { id: args.noteId, userId: args.userId }, data: { status: "archived" } });
  removeKnowledgeNote(args.ftsStore, note.id);
  return note;
}
export async function deleteKnowledgeNote(prisma: PrismaClient, args: { userId: string; noteId: string; ftsStore?: FtsStore }) {
  const note = await prisma.knowledgeNote.delete({ where: { id: args.noteId, userId: args.userId } });
  removeKnowledgeNote(args.ftsStore, note.id);
  return note;
}
export async function upsertKnowledgeNoteFromCoach(prisma: PrismaClient, args: { userId: string; note: CoachNoteInput; traceId?: string; ftsStore?: FtsStore; skipLookupIncrementForExisting?: boolean }) {
  if (!isCleanCoachKnowledgeNote(args.note)) return { saved: false as const, reason: "Empty note" };
  const conceptKey = normalizeKnowledgeConceptKey(args.note.conceptKey, args.note.category);
  const existing = await prisma.knowledgeNote.findUnique({ where: { userId_conceptKey: { userId: args.userId, conceptKey } } });
  const note = await prisma.knowledgeNote.upsert({
    where: { userId_conceptKey: { userId: args.userId, conceptKey } },
    update: existing?.userEdited ? { lastNeededAt: new Date(), lookupCount: { increment: args.skipLookupIncrementForExisting ? 0 : 1 } } : { ...args.note, lastNeededAt: new Date(), lookupCount: { increment: args.skipLookupIncrementForExisting ? 0 : 1 } },
    create: { userId: args.userId, ...args.note, conceptKey, source: "user_explicit", sourceTraceIds: JSON.stringify(args.traceId ? [args.traceId] : []) },
  });
  indexKnowledgeNote(args.ftsStore, note);
  return { saved: true as const, note, alreadyExisted: Boolean(existing) };
}
export function knowledgeNoteFtsRefId(noteId: string) { return noteId; }
export function knowledgeNoteFtsContent(note: Pick<CoachNoteInput, "title" | "snippet" | "whenToUse">) { return `${note.title}\n${note.snippet}\n${note.whenToUse}`; }

function indexKnowledgeNote(
  store: FtsStore | undefined,
  note: { id: string; title: string; snippet: string; whenToUse: string },
) {
  (store ?? getDefaultFtsStore()).indexMemoryDocument({
    kind: "knowledge_note",
    refId: knowledgeNoteFtsRefId(note.id),
    content: knowledgeNoteFtsContent(note),
  });
}

function removeKnowledgeNote(store: FtsStore | undefined, noteId: string) {
  (store ?? getDefaultFtsStore()).removeMemoryDocument(knowledgeNoteFtsRefId(noteId));
}
