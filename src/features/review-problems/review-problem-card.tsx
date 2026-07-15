"use client";

import Link from "next/link";
import { AlertTriangle, BookOpenCheck, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CoachMarkdown } from "@/components/coach/coach-markdown";
import { Button } from "@/components/ui/button";
import { difficultyBadgeClass } from "@/lib/ui-status";
import { cn } from "@/lib/utils";
import type { ReviewProblemCard } from "@/server/planner/review-focus/review-focus.types";

const outcomeLabel: Record<NonNullable<ReviewProblemCard["lastOutcome"]>, string> = {
  passed: "passed",
  failed: "failed",
  hesitated: "hesitated",
  struggled: "struggled",
  unsolved: "unsolved",
};

function workbenchHref(card: ReviewProblemCard) {
  const params = new URLSearchParams({ problem: card.slug });
  if (card.planItemId) {
    params.set("planItemId", card.planItemId);
  }
  return `/workbench?${params.toString()}`;
}

function problemTitle(card: ReviewProblemCard) {
  return card.leetcodeNumber ? `${card.leetcodeNumber}. ${card.title}` : card.title;
}

function flashcardUnavailableText(card: ReviewProblemCard) {
  if (card.flashcardStatus === "can_generate") {
    return "Diagnosis is available; flashcard generation is pending.";
  }

  return "This diagnosis is incomplete, so no flashcard is available.";
}

function manualSavedAtLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function FlashcardAnswer({ answer }: { answer: string }) {
  return (
    <CoachMarkdown
      className="mt-2 max-w-full"
      density="compact"
      markdown={answer}
    />
  );
}

export function ReviewProblemCardView({
  card,
  resolved = false,
}: {
  card: ReviewProblemCard;
  resolved?: boolean;
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const flashcardDisabledTitle = card.hasFlashcard
    ? undefined
    : flashcardUnavailableText(card);

  return (
    <article className="rounded-md border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium",
                difficultyBadgeClass(card.difficulty),
              )}
            >
              {card.difficulty ?? "Unknown"}
            </span>
            {card.primaryPatternTag ? (
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {card.primaryPatternTag}
              </span>
            ) : null}
            {card.manualEntry ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Manual Entry
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 line-clamp-1 text-sm font-semibold">
            {problemTitle(card)}
          </h3>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          Last: {card.lastOutcome ? outcomeLabel[card.lastOutcome] : "pending"}
        </span>
      </div>

      <p className="mt-2 flex gap-2 text-sm leading-6 text-muted-foreground">
        <AlertTriangle
          className={cn(
            "mt-1 h-4 w-4 shrink-0",
            resolved ? "text-emerald-600" : "text-amber-600",
          )}
          aria-hidden="true"
        />
        <span>
          <span className="font-medium text-foreground">
            {resolved ? "Resolved: " : "Common trap: "}
          </span>
          {card.trapSummary}
        </span>
      </p>

      {card.manualEntry ? (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-950">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
              <BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Problem Guide
            </span>
            <span className="text-xs text-emerald-800/80">
              Saved {card.manualEntry.saveCount}{" "}
              {card.manualEntry.saveCount === 1 ? "time" : "times"}
              {manualSavedAtLabel(card.manualEntry.lastSavedAt)
                ? ` · ${manualSavedAtLabel(card.manualEntry.lastSavedAt)}`
                : ""}
            </span>
          </div>
          <CoachMarkdown
            className="mt-2 max-h-72 max-w-full overflow-y-auto"
            density="compact"
            markdown={card.manualEntry.guideMarkdown}
          />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant={resolved ? "outline" : "default"}>
          <Link href={workbenchHref(card)}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Redo Review
          </Link>
        </Button>
        <Dialog
          onOpenChange={(open) => {
            if (!open) {
              setShowAnswer(false);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              disabled={!card.hasFlashcard}
              size="sm"
              title={flashcardDisabledTitle}
              type="button"
              variant="outline"
            >
              <BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Flashcard
            </Button>
          </DialogTrigger>
          {card.flashcard ? (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{problemTitle(card)}</DialogTitle>
                <DialogDescription>
                  Answer the prompt first, then reveal the back of the card.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Self-check prompt
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  {card.flashcard.question}
                </p>
              </div>
              {showAnswer ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-950">
                  <p className="text-xs font-semibold">Answer</p>
                  <FlashcardAnswer answer={card.flashcard.answer} />
                </div>
              ) : null}
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowAnswer((value) => !value)}
                  size="sm"
                  type="button"
                  variant={showAnswer ? "outline" : "default"}
                >
                  {showAnswer ? "Back to Prompt" : "Show Answer"}
                </Button>
              </div>
            </DialogContent>
          ) : null}
        </Dialog>
        {!card.hasFlashcard ? (
          <span className="self-center text-xs text-muted-foreground">
            {flashcardUnavailableText(card)}
          </span>
        ) : null}
      </div>
    </article>
  );
}
