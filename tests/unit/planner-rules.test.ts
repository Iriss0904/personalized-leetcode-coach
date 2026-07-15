import { describe, expect, it } from "vitest";
import { calculateDailyDose, intervalForRating } from "@/server/planner/planner-rules";
import { selectTodayReviewFocusCards } from "@/server/planner/review-focus/build-review-focus-board";
import type { ReviewProblemCard } from "@/server/planner/review-focus/review-focus.types";
describe("public deterministic planner policy", () => {
  it("keeps the daily dose within a small local range", () => { expect(calculateDailyDose(1)).toBe(1); expect(calculateDailyDose(80)).toBe(5); });
  it("reviews unsolved work sooner than easy work", () => { expect(intervalForRating({ rating: "unsolved" })).toBeLessThan(intervalForRating({ rating: "easy" })); });
  it("keeps an unresolved attempt in Today review focus", () => {
    const resolved = card({ problemId: "one", lastOutcome: "passed" });
    const unresolved = card({ problemId: "one", lastOutcome: "struggled" });
    expect(
      selectTodayReviewFocusCards({
        cards: [unresolved],
        resolvedCards: [resolved],
      })[0]?.lastOutcome,
    ).toBe("struggled");
  });
});

function card(overrides: Partial<ReviewProblemCard>): ReviewProblemCard {
  return {
    problemId: "problem",
    slug: "problem",
    title: "Problem",
    difficulty: "Easy",
    leetcodeNumber: 1,
    planItemId: null,
    lastOutcome: "passed",
    trapSummary: "Synthetic public review",
    dueDate: null,
    priority: 0.5,
    primaryPatternTag: "Array",
    hasFlashcard: false,
    flashcardStatus: "diagnosis_unavailable",
    flashcard: null,
    ...overrides,
  };
}
