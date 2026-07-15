export type ReviewProblemOutcome =
  | "passed"
  | "failed"
  | "hesitated"
  | "struggled"
  | "unsolved";

export type ReviewProblemFlashcard = {
  question: string;
  answer: string;
};

export type ReviewProblemFlashcardStatus =
  | "available"
  | "can_generate"
  | "diagnosis_unavailable";

export type ReviewProblemManualEntry = {
  id: string;
  title: string;
  guideMarkdown: string;
  selfCheckQuestion: string | null;
  selfCheckAnswer: string | null;
  saveCount: number;
  lastSavedAt: string;
  tags: string[];
};

export type ReviewProblemCard = {
  problemId: string;
  slug: string;
  title: string;
  difficulty: string | null;
  leetcodeNumber: number | null;
  planItemId: string | null;
  lastOutcome: ReviewProblemOutcome | null;
  trapSummary: string | null;
  dueDate: string | null;
  priority: number;
  primaryPatternTag: string | null;
  hasFlashcard: boolean;
  flashcardStatus: ReviewProblemFlashcardStatus;
  flashcard: ReviewProblemFlashcard | null;
  manualEntry?: ReviewProblemManualEntry;
};

export type ReviewFocusBoard = {
  cards: ReviewProblemCard[];
};

export type ReviewProblemInput = {
  problemId: string;
  slug: string;
  title: string;
  difficulty: string | null;
  leetcodeNumber: number | null;
  planItemId?: string | null;
  latestRunStatus?: string | null;
  latestSelfRating?: string | null;
  lastAttemptAt: Date;
  dueDate?: Date | null;
  problemTags: string[];
  diagnosis: {
    mistakeTags: string[];
    userIssueSummary: string | null;
    coachSummary: string | null;
    selfCheckQuestion: string | null;
    selfCheckAnswer: string | null;
  } | null;
  recurringWeaknessTags: string[];
};

export type ResolvedReviewProblemInput = ReviewProblemInput & {
  resolvedTrapDiagnosis: NonNullable<ReviewProblemInput["diagnosis"]>;
};

export type ReviewProblemLibrary = {
  cards: ReviewProblemCard[];
  resolvedCards: ReviewProblemCard[];
};
