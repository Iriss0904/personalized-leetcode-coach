import type { PrismaClient } from "@prisma/client";
import {
  publicDefaultProfile,
  localUserHandle,
} from "@/features/onboarding/profile-defaults";
import defaultPrisma from "@/server/db/prisma";
import { listMistakeBookEntriesForNotebook } from "@/server/memory/store/mistake-book-entry-store";
import { loadReviewProblemLibrary } from "@/server/planner/review-focus/build-review-focus-board";
import type {
  ReviewProblemCard,
  ReviewProblemFlashcard,
} from "@/server/planner/review-focus/review-focus.types";
import { buildNotebookMarkdown } from "./notebook-markdown";

export type NotebookProblemGroup = {
  tag: string;
  cards: ReviewProblemCard[];
};

export type NotebookData = {
  displayName: string;
  groups: NotebookProblemGroup[];
  resolved: ReviewProblemCard[];
  markdown: string;
};

function groupCards(cards: ReviewProblemCard[]) {
  const grouped = new Map<string, ReviewProblemCard[]>();
  for (const card of cards) {
    const tag = card.primaryPatternTag ?? "general";
    grouped.set(tag, [...(grouped.get(tag) ?? []), card]);
  }

  return [...grouped.entries()]
    .map(([tag, groupCards]) => ({ tag, cards: groupCards }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

function parseTags(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

function manualFlashcardFor(entry: {
  selfCheckQuestion: string | null;
  selfCheckAnswer: string | null;
}): ReviewProblemFlashcard | null {
  return entry.selfCheckQuestion && entry.selfCheckAnswer
    ? {
        question: entry.selfCheckQuestion,
        answer: entry.selfCheckAnswer,
      }
    : null;
}

type ManualEntryRow = Awaited<
  ReturnType<typeof listMistakeBookEntriesForNotebook>
>[number];

function cardFromManualEntry(
  row: ManualEntryRow,
  existing?: ReviewProblemCard,
): ReviewProblemCard {
  const entryTags = parseTags(row.tags);
  const problemTags = parseTags(row.problem.tags);
  const tags = entryTags.length > 0 ? entryTags : problemTags;
  const manualFlashcard = manualFlashcardFor(row);
  const manualEntry = {
    id: row.id,
    title: row.title,
    guideMarkdown: row.guideMarkdown,
    selfCheckQuestion: row.selfCheckQuestion,
    selfCheckAnswer: row.selfCheckAnswer,
    saveCount: row.saveCount,
    lastSavedAt: row.lastSavedAt.toISOString(),
    tags,
  };

  if (existing) {
    return {
      ...existing,
      trapSummary: row.title,
      primaryPatternTag: existing.primaryPatternTag ?? tags[0] ?? null,
      hasFlashcard: Boolean(manualFlashcard ?? existing.flashcard),
      flashcardStatus: manualFlashcard ? "available" : existing.flashcardStatus,
      flashcard: manualFlashcard ?? existing.flashcard,
      manualEntry,
    };
  }

  return {
    problemId: row.problemId,
    slug: row.problem.slug,
    title: row.problem.title,
    difficulty: row.problem.difficulty,
    leetcodeNumber: row.problem.leetcodeNumber,
    planItemId: null,
    lastOutcome: null,
    trapSummary: row.title,
    dueDate: null,
    priority: 0,
    primaryPatternTag: tags[0] ?? null,
    hasFlashcard: Boolean(manualFlashcard),
    flashcardStatus: manualFlashcard ? "available" : "diagnosis_unavailable",
    flashcard: manualFlashcard,
    manualEntry,
  };
}

export async function loadNotebookData(
  prisma: PrismaClient = defaultPrisma,
): Promise<NotebookData> {
  const user = await prisma.user.upsert({
    where: { handle: localUserHandle },
    update: {},
    create: { handle: localUserHandle },
  });

  const [profile, goal] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    prisma.readinessGoal.findFirst({
      where: { userId: user.id, status: "active" },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    }),
  ]);
  const [library, manualEntries] = await Promise.all([
    loadReviewProblemLibrary(prisma, {
      userId: user.id,
      goalId: goal?.id ?? null,
      now: new Date(),
    }),
    listMistakeBookEntriesForNotebook(prisma, user.id),
  ]);
  const manualProblemIds = new Set(manualEntries.map((entry) => entry.problemId));
  const autoCardsByProblem = new Map(
    [...library.cards, ...library.resolvedCards].map((card) => [
      card.problemId,
      card,
    ]),
  );
  const manualCards = manualEntries.map((entry) =>
    cardFromManualEntry(entry, autoCardsByProblem.get(entry.problemId)),
  );
  const autoCards = library.cards.filter(
    (card) => !manualProblemIds.has(card.problemId),
  );
  const resolvedCards = library.resolvedCards.filter(
    (card) => !manualProblemIds.has(card.problemId),
  );
  const groups = groupCards([...manualCards, ...autoCards]);

  return {
    displayName: profile?.displayName ?? publicDefaultProfile.displayName,
    groups,
    resolved: resolvedCards,
    markdown: buildNotebookMarkdown({
      groups,
      resolved: resolvedCards,
      generatedAt: new Date(),
    }),
  };
}
