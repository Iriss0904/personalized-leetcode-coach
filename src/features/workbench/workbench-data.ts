import { publicHot150Bank } from "@/data/hot150/local-bank.public";
import { findPublicHot150Problem } from "@/data/hot150/local-run-types";
import { getCoachProviderStatus } from "@/lib/env";
import prisma from "@/server/db/prisma";
import { localUserHandle } from "@/features/onboarding/profile-defaults";
import { isPublicPythonRuntime } from "@/server/tools/code-runner/runtime-config";
import type { WorkbenchInitialData } from "./types";

export async function loadWorkbenchData(slug?: string, planItemId?: string): Promise<WorkbenchInitialData> {
  const problem =
    (slug && findPublicHot150Problem(publicHot150Bank, slug)) ||
    publicHot150Bank.problems[0];
  let displayName = "Local Learner";
  let draftCode = starterCodeFor(problem);
  let customTests: WorkbenchInitialData["customTests"] = [];
  let selectedTestCaseIds = problem.visibleTests.map(({ id }) => id);
  let chatMessages: WorkbenchInitialData["chatMessages"] = [];

  try {
    const user = await prisma.user.upsert({
      where: { handle: localUserHandle },
      update: {},
      create: { handle: localUserHandle },
      include: { profile: true },
    });
    displayName = user.profile?.displayName ?? displayName;
    const row = await prisma.problem.findUnique({ where: { slug: problem.slug } });
    if (row) {
      const [draft, testRows, session] = await Promise.all([
        prisma.codeDraft.findUnique({
          where: { userId_problemId_language: { userId: user.id, problemId: row.id, language: "Python" } },
        }),
        prisma.problemTestCase.findMany({
          where: { userId: user.id, problemId: row.id, source: "custom", isVisible: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        }),
        prisma.chatSession.findUnique({
          where: { userId_problemId: { userId: user.id, problemId: row.id } },
          include: { messages: { orderBy: { sequence: "asc" }, take: 40 } },
        }),
      ]);
      draftCode = draft?.content || draftCode;
      customTests = testRows.map((test) => ({
        id: test.id,
        label: test.label,
        input: parseJsonRecord(test.inputJson),
        expected: parseJson(test.expectedJson),
        source: "custom",
      }));
      selectedTestCaseIds = parseSelectedIds(draft?.selectedTestCaseIds, [
        ...problem.visibleTests.map(({ id }) => id),
        ...customTests.map(({ id }) => id),
      ]);
      chatMessages = (session?.messages ?? [])
        .filter((message): message is typeof message & { role: "user" | "assistant" } => message.role === "user" || message.role === "assistant")
        .map((message) => ({ id: message.id, role: message.role, text: message.contentMarkdown }));
    }
  } catch {
    // The setup page and doctor explain how to initialize the local database.
  }

  return {
    displayName,
    coachProviderStatus: getCoachProviderStatus(),
    pistonHealthy: await isPistonHealthy(),
    catalog: publicHot150Bank.problems.map(({ number, slug: entrySlug, title, difficulty, section, tags }) => ({
      number,
      slug: entrySlug,
      title,
      difficulty,
      section,
      tags,
    })),
    problem,
    starterCode: starterCodeFor(problem),
    draftCode,
    customTests,
    selectedTestCaseIds,
    chatMessages,
    planItemId: planItemId ?? null,
  };
}

function parseJson(value: string): unknown {
  try { return JSON.parse(value) as unknown; } catch { return null; }
}

function parseJsonRecord(value: string): Record<string, unknown> {
  const parsed = parseJson(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
}

function parseSelectedIds(value: string | undefined, fallback: string[]) {
  if (!value) return fallback;
  const parsed = parseJson(value);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : fallback;
}

export function starterCodeFor(problem: (typeof publicHot150Bank.problems)[number]) {
  if (problem.signature.contractKind === "design_object") {
    return `class ${problem.signature.className}:\n    def __init__(self, *args):\n        pass\n`;
  }
  const parameters = problem.signature.parameters.map(({ name }) => name).join(", ");
  return `class Solution:\n    def ${problem.signature.methodName}(self${parameters ? `, ${parameters}` : ""}):\n        pass\n`;
}

async function isPistonHealthy() {
  const baseUrl = (process.env.PISTON_URL ?? "http://127.0.0.1:2000").replace(/\/$/, "");
  try {
    const response = await fetch(`${baseUrl}/api/v2/runtimes`, { cache: "no-store", signal: AbortSignal.timeout(800) });
    if (!response.ok) return false;
    const runtimes = (await response.json()) as Array<{
      language?: string;
      version?: string;
    }>;
    return runtimes.some(isPublicPythonRuntime);
  } catch {
    return false;
  }
}
