-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "handle" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "interviewGoal" TEXT,
    "preferredLanguages" TEXT NOT NULL DEFAULT '["Python"]',
    "strongPatterns" TEXT NOT NULL DEFAULT '[]',
    "weakPatterns" TEXT NOT NULL DEFAULT '[]',
    "explanationStyle" TEXT NOT NULL DEFAULT '[]',
    "outputPreferences" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leetcodeNumber" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "hot150Order" INTEGER NOT NULL,
    "hot150Section" TEXT NOT NULL,
    "officialUrl" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "starterCodePython" TEXT NOT NULL,
    "methodName" TEXT NOT NULL,
    "inputContractJson" TEXT NOT NULL,
    "outputContractJson" TEXT NOT NULL,
    "localRunStatus" TEXT NOT NULL DEFAULT 'runnable',
    "localRunStatusMessage" TEXT,
    "comparisonStrategy" TEXT NOT NULL DEFAULT 'exact',
    "comparisonConfigJson" TEXT NOT NULL DEFAULT '{}',
    "contractKind" TEXT NOT NULL DEFAULT 'pure_function',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProblemTestCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "problemId" TEXT NOT NULL,
    "userId" TEXT,
    "label" TEXT NOT NULL,
    "inputJson" TEXT NOT NULL,
    "expectedJson" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'public_visible',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProblemTestCase_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProblemTestCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CodeDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'Python',
    "content" TEXT NOT NULL DEFAULT '',
    "selectedTestCaseIds" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CodeDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CodeDraft_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeRunLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "codeDraftId" TEXT,
    "language" TEXT NOT NULL DEFAULT 'Python',
    "codeHash" TEXT,
    "executionFingerprint" TEXT,
    "runOrdinal" INTEGER NOT NULL,
    "selectedTestCaseIds" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL,
    "passedCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'piston',
    "rawResultJson" TEXT NOT NULL DEFAULT '{}',
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeRunLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticeRunLog_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticeRunLog_codeDraftId_fkey" FOREIGN KEY ("codeDraftId") REFERENCES "CodeDraft" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "chatSessionId" TEXT NOT NULL,
    "codeDraftId" TEXT,
    "language" TEXT NOT NULL DEFAULT 'Python',
    "userState" TEXT,
    "userQuestion" TEXT,
    "codeSnapshot" TEXT NOT NULL DEFAULT '',
    "selectedTestCaseIds" TEXT NOT NULL DEFAULT '[]',
    "selectedTestsJson" TEXT NOT NULL DEFAULT '[]',
    "coachReplyMarkdown" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewAttempt_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewAttempt_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewAttempt_codeDraftId_fkey" FOREIGN KEY ("codeDraftId") REFERENCES "CodeDraft" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RunEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewAttemptId" TEXT,
    "chatSessionId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'review',
    "toolCallId" TEXT,
    "codeHash" TEXT,
    "executionFingerprint" TEXT,
    "evidenceKind" TEXT NOT NULL DEFAULT 'executed',
    "status" TEXT NOT NULL,
    "passedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER,
    "stdout" TEXT,
    "stderr" TEXT,
    "actualOutput" TEXT,
    "expectedOutput" TEXT,
    "firstFailedCaseJson" TEXT,
    "rawResultJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RunEvidence_reviewAttemptId_fkey" FOREIGN KEY ("reviewAttemptId") REFERENCES "ReviewAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RunEvidence_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiagnosisResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewAttemptId" TEXT NOT NULL,
    "diagnosisJson" TEXT NOT NULL DEFAULT '{}',
    "memoryUpdateCandidateJson" TEXT NOT NULL DEFAULT '{}',
    "mistakeTags" TEXT NOT NULL DEFAULT '[]',
    "skillTags" TEXT NOT NULL DEFAULT '[]',
    "userIssueSummary" TEXT,
    "coachSummary" TEXT,
    "selfCheckQuestion" TEXT,
    "selfCheckAnswer" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiagnosisResult_reviewAttemptId_fkey" FOREIGN KEY ("reviewAttemptId") REFERENCES "ReviewAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "title" TEXT,
    "primaryLanguage" TEXT NOT NULL DEFAULT 'Python',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rollingSummary" TEXT,
    "sessionPlanJson" TEXT,
    "clearedBeforeSequence" INTEGER NOT NULL DEFAULT 0,
    "clearedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatSession_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "reviewAttemptId" TEXT,
    "role" TEXT NOT NULL,
    "contentMarkdown" TEXT NOT NULL,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "sequence" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatMessage_reviewAttemptId_fkey" FOREIGN KEY ("reviewAttemptId") REFERENCES "ReviewAttempt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProblemHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "reviewAttemptId" TEXT NOT NULL,
    "chatSessionId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'Python',
    "userState" TEXT,
    "problemTags" TEXT NOT NULL DEFAULT '[]',
    "runStatus" TEXT NOT NULL,
    "failedCaseSummary" TEXT,
    "userIssueSummary" TEXT,
    "coachSummary" TEXT,
    "memoryUpdateSummary" TEXT,
    "nextRecommendation" TEXT,
    "durationSeconds" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProblemHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProblemHistory_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProblemHistory_reviewAttemptId_fkey" FOREIGN KEY ("reviewAttemptId") REFERENCES "ReviewAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProblemHistory_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "L1MemoryEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "problemId" TEXT,
    "chatSessionId" TEXT,
    "reviewAttemptId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventJson" TEXT NOT NULL DEFAULT '{}',
    "content" TEXT,
    "source" TEXT,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "L1MemoryEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "L1MemoryEvent_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "L1MemoryEvent_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "L1MemoryEvent_reviewAttemptId_fkey" FOREIGN KEY ("reviewAttemptId") REFERENCES "ReviewAttempt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "L2MemoryFact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "problemId" TEXT,
    "sourceReviewAttemptId" TEXT,
    "factType" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "label" TEXT,
    "value" TEXT,
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "evidenceCount" INTEGER NOT NULL DEFAULT 1,
    "lastEvidenceSummary" TEXT,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT NOT NULL DEFAULT 'local_review',
    "evidenceTraceIds" TEXT NOT NULL DEFAULT '[]',
    "contradictionSummary" TEXT,
    "validationJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "L2MemoryFact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "L2MemoryFact_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "L2MemoryFact_sourceReviewAttemptId_fkey" FOREIGN KEY ("sourceReviewAttemptId") REFERENCES "ReviewAttempt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlgorithmHintProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AlgorithmHintProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AlgorithmHintProgress_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MemoryEpisode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "problemId" TEXT,
    "chatSessionId" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "salience" REAL NOT NULL DEFAULT 0.5,
    "sourceTraceIds" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemoryEpisode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MemoryEpisode_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MemoryEpisode_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "conceptKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "snippet" TEXT NOT NULL,
    "whenToUse" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "lookupCount" INTEGER NOT NULL DEFAULT 1,
    "firstNeededAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastNeededAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT NOT NULL DEFAULT 'user',
    "userEdited" BOOLEAN NOT NULL DEFAULT false,
    "sourceTraceIds" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MistakeBookEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "chatSessionId" TEXT,
    "reviewAttemptId" TEXT,
    "title" TEXT NOT NULL,
    "guideMarkdown" TEXT NOT NULL,
    "selfCheckQuestion" TEXT,
    "selfCheckAnswer" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "saveCount" INTEGER NOT NULL DEFAULT 1,
    "sourceTraceIds" TEXT NOT NULL DEFAULT '[]',
    "firstSavedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSavedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MistakeBookEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MistakeBookEntry_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MistakeBookEntry_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MistakeBookEntry_reviewAttemptId_fkey" FOREIGN KEY ("reviewAttemptId") REFERENCES "ReviewAttempt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadinessGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "targetLabel" TEXT NOT NULL,
    "interviewDate" DATETIME NOT NULL,
    "weeklyHours" REAL NOT NULL,
    "dailyDoseTarget" INTEGER NOT NULL DEFAULT 1,
    "planVersion" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReadinessGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlannerPlanItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'plan',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledDate" DATETIME,
    "sortOrder" INTEGER NOT NULL,
    "whyJson" TEXT NOT NULL DEFAULT '[]',
    "startedAt" DATETIME,
    "lastOpenedAt" DATETIME,
    "deferredFromDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlannerPlanItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlannerPlanItem_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "ReadinessGoal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlannerPlanItem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlannerDailyDoseItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "doseDate" DATETIME NOT NULL,
    "problemId" TEXT NOT NULL,
    "planItemId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'plan',
    "sortOrder" INTEGER NOT NULL,
    "whyJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlannerDailyDoseItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlannerDailyDoseItem_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "ReadinessGoal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlannerDailyDoseItem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlannerDailyDoseItem_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "PlannerPlanItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlannerOutcome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "goalId" TEXT,
    "planItemId" TEXT,
    "problemId" TEXT NOT NULL,
    "reviewAttemptId" TEXT NOT NULL,
    "problemHistoryId" TEXT NOT NULL,
    "selfRating" TEXT NOT NULL,
    "patternTagsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlannerOutcome_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlannerOutcome_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "ReadinessGoal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PlannerOutcome_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "PlannerPlanItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PlannerOutcome_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlannerOutcome_reviewAttemptId_fkey" FOREIGN KEY ("reviewAttemptId") REFERENCES "ReviewAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlannerOutcome_problemHistoryId_fkey" FOREIGN KEY ("problemHistoryId") REFERENCES "ProblemHistory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "patternTag" TEXT,
    "dueDate" DATETIME NOT NULL,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "ease" REAL NOT NULL DEFAULT 2.5,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "lastRating" TEXT NOT NULL,
    "lastOutcomeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReviewSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewSchedule_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "ReadinessGoal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewSchedule_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_leetcodeNumber_key" ON "Problem"("leetcodeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_slug_key" ON "Problem"("slug");

-- CreateIndex
CREATE INDEX "ProblemTestCase_problemId_idx" ON "ProblemTestCase"("problemId");

-- CreateIndex
CREATE INDEX "ProblemTestCase_userId_idx" ON "ProblemTestCase"("userId");

-- CreateIndex
CREATE INDEX "CodeDraft_problemId_idx" ON "CodeDraft"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "CodeDraft_userId_problemId_language_key" ON "CodeDraft"("userId", "problemId", "language");

-- CreateIndex
CREATE INDEX "PracticeRunLog_userId_problemId_idx" ON "PracticeRunLog"("userId", "problemId");

-- CreateIndex
CREATE INDEX "PracticeRunLog_codeDraftId_idx" ON "PracticeRunLog"("codeDraftId");

-- CreateIndex
CREATE INDEX "PracticeRunLog_codeHash_idx" ON "PracticeRunLog"("codeHash");

-- CreateIndex
CREATE INDEX "PracticeRunLog_executionFingerprint_idx" ON "PracticeRunLog"("executionFingerprint");

-- CreateIndex
CREATE INDEX "PracticeRunLog_createdAt_idx" ON "PracticeRunLog"("createdAt");

-- CreateIndex
CREATE INDEX "ReviewAttempt_userId_problemId_idx" ON "ReviewAttempt"("userId", "problemId");

-- CreateIndex
CREATE INDEX "ReviewAttempt_chatSessionId_idx" ON "ReviewAttempt"("chatSessionId");

-- CreateIndex
CREATE INDEX "ReviewAttempt_codeDraftId_idx" ON "ReviewAttempt"("codeDraftId");

-- CreateIndex
CREATE INDEX "ReviewAttempt_createdAt_idx" ON "ReviewAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "RunEvidence_reviewAttemptId_idx" ON "RunEvidence"("reviewAttemptId");

-- CreateIndex
CREATE INDEX "RunEvidence_chatSessionId_idx" ON "RunEvidence"("chatSessionId");

-- CreateIndex
CREATE INDEX "RunEvidence_codeHash_idx" ON "RunEvidence"("codeHash");

-- CreateIndex
CREATE INDEX "RunEvidence_executionFingerprint_idx" ON "RunEvidence"("executionFingerprint");

-- CreateIndex
CREATE INDEX "RunEvidence_source_idx" ON "RunEvidence"("source");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosisResult_reviewAttemptId_key" ON "DiagnosisResult"("reviewAttemptId");

-- CreateIndex
CREATE INDEX "ChatSession_problemId_idx" ON "ChatSession"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatSession_userId_problemId_key" ON "ChatSession"("userId", "problemId");

-- CreateIndex
CREATE INDEX "ChatMessage_reviewAttemptId_idx" ON "ChatMessage"("reviewAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_sessionId_sequence_key" ON "ChatMessage"("sessionId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemHistory_reviewAttemptId_key" ON "ProblemHistory"("reviewAttemptId");

-- CreateIndex
CREATE INDEX "ProblemHistory_userId_problemId_idx" ON "ProblemHistory"("userId", "problemId");

-- CreateIndex
CREATE INDEX "ProblemHistory_chatSessionId_idx" ON "ProblemHistory"("chatSessionId");

-- CreateIndex
CREATE INDEX "ProblemHistory_createdAt_idx" ON "ProblemHistory"("createdAt");

-- CreateIndex
CREATE INDEX "L1MemoryEvent_userId_occurredAt_idx" ON "L1MemoryEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "L1MemoryEvent_problemId_idx" ON "L1MemoryEvent"("problemId");

-- CreateIndex
CREATE INDEX "L1MemoryEvent_chatSessionId_idx" ON "L1MemoryEvent"("chatSessionId");

-- CreateIndex
CREATE INDEX "L1MemoryEvent_reviewAttemptId_idx" ON "L1MemoryEvent"("reviewAttemptId");

-- CreateIndex
CREATE INDEX "L2MemoryFact_problemId_idx" ON "L2MemoryFact"("problemId");

-- CreateIndex
CREATE INDEX "L2MemoryFact_sourceReviewAttemptId_idx" ON "L2MemoryFact"("sourceReviewAttemptId");

-- CreateIndex
CREATE INDEX "L2MemoryFact_lastSeenAt_idx" ON "L2MemoryFact"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "L2MemoryFact_userId_factType_tag_key" ON "L2MemoryFact"("userId", "factType", "tag");

-- CreateIndex
CREATE INDEX "AlgorithmHintProgress_problemId_idx" ON "AlgorithmHintProgress"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "AlgorithmHintProgress_userId_problemId_key" ON "AlgorithmHintProgress"("userId", "problemId");

-- CreateIndex
CREATE INDEX "MemoryEpisode_userId_createdAt_idx" ON "MemoryEpisode"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MemoryEpisode_userId_kind_idx" ON "MemoryEpisode"("userId", "kind");

-- CreateIndex
CREATE INDEX "KnowledgeNote_userId_status_lastNeededAt_idx" ON "KnowledgeNote"("userId", "status", "lastNeededAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeNote_userId_conceptKey_key" ON "KnowledgeNote"("userId", "conceptKey");

-- CreateIndex
CREATE INDEX "MistakeBookEntry_userId_lastSavedAt_idx" ON "MistakeBookEntry"("userId", "lastSavedAt");

-- CreateIndex
CREATE INDEX "MistakeBookEntry_problemId_idx" ON "MistakeBookEntry"("problemId");

-- CreateIndex
CREATE INDEX "MistakeBookEntry_chatSessionId_idx" ON "MistakeBookEntry"("chatSessionId");

-- CreateIndex
CREATE INDEX "MistakeBookEntry_reviewAttemptId_idx" ON "MistakeBookEntry"("reviewAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "MistakeBookEntry_userId_problemId_key" ON "MistakeBookEntry"("userId", "problemId");

-- CreateIndex
CREATE INDEX "ReadinessGoal_userId_status_idx" ON "ReadinessGoal"("userId", "status");

-- CreateIndex
CREATE INDEX "ReadinessGoal_interviewDate_idx" ON "ReadinessGoal"("interviewDate");

-- CreateIndex
CREATE INDEX "PlannerPlanItem_userId_status_scheduledDate_idx" ON "PlannerPlanItem"("userId", "status", "scheduledDate");

-- CreateIndex
CREATE INDEX "PlannerPlanItem_userId_goalId_deferredFromDate_idx" ON "PlannerPlanItem"("userId", "goalId", "deferredFromDate");

-- CreateIndex
CREATE INDEX "PlannerPlanItem_goalId_sortOrder_idx" ON "PlannerPlanItem"("goalId", "sortOrder");

-- CreateIndex
CREATE INDEX "PlannerPlanItem_problemId_idx" ON "PlannerPlanItem"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "PlannerPlanItem_goalId_problemId_key" ON "PlannerPlanItem"("goalId", "problemId");

-- CreateIndex
CREATE INDEX "PlannerDailyDoseItem_userId_goalId_doseDate_idx" ON "PlannerDailyDoseItem"("userId", "goalId", "doseDate");

-- CreateIndex
CREATE INDEX "PlannerDailyDoseItem_planItemId_idx" ON "PlannerDailyDoseItem"("planItemId");

-- CreateIndex
CREATE INDEX "PlannerDailyDoseItem_problemId_idx" ON "PlannerDailyDoseItem"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "PlannerDailyDoseItem_goalId_doseDate_problemId_key" ON "PlannerDailyDoseItem"("goalId", "doseDate", "problemId");

-- CreateIndex
CREATE UNIQUE INDEX "PlannerOutcome_reviewAttemptId_key" ON "PlannerOutcome"("reviewAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "PlannerOutcome_problemHistoryId_key" ON "PlannerOutcome"("problemHistoryId");

-- CreateIndex
CREATE INDEX "PlannerOutcome_userId_createdAt_idx" ON "PlannerOutcome"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PlannerOutcome_goalId_idx" ON "PlannerOutcome"("goalId");

-- CreateIndex
CREATE INDEX "PlannerOutcome_planItemId_idx" ON "PlannerOutcome"("planItemId");

-- CreateIndex
CREATE INDEX "PlannerOutcome_problemId_idx" ON "PlannerOutcome"("problemId");

-- CreateIndex
CREATE INDEX "ReviewSchedule_userId_dueDate_idx" ON "ReviewSchedule"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "ReviewSchedule_goalId_status_dueDate_idx" ON "ReviewSchedule"("goalId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "ReviewSchedule_patternTag_idx" ON "ReviewSchedule"("patternTag");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSchedule_userId_goalId_problemId_key" ON "ReviewSchedule"("userId", "goalId", "problemId");
