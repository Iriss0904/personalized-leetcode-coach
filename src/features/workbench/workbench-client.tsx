"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Loader2,
  Play,
  Save,
  Send,
  TestTube2,
  Trash2,
  Wrench,
} from "lucide-react";
import { CoachMarkdown } from "@/components/coach/coach-markdown";
import { AppShell } from "@/components/layout/app-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { CodeDraftEditor } from "@/components/workbench/code-draft-editor";
import { ProblemStatement } from "@/components/workbench/problem-statement";
import { summarizeRunEvidence } from "./run-evidence-ui";
import type {
  WorkbenchChatResponse,
  WorkbenchInitialData,
  WorkbenchReviewResponse,
  WorkbenchRunResponse,
  WorkbenchTestCase,
} from "./types";
import { useActiveTimer } from "./use-active-timer";

type ChatTurn = { id: string; role: "user" | "assistant"; text: string };

export function WorkbenchClient({ initialData }: { initialData: WorkbenchInitialData }) {
  const router = useRouter();
  const [code, setCode] = useState(initialData.draftCode);
  const [tests, setTests] = useState<WorkbenchTestCase[]>([
    ...initialData.problem.visibleTests.map((test) => ({ ...test, source: "public_visible" as const })),
    ...initialData.customTests,
  ]);
  const [selectedIds, setSelectedIds] = useState(() => new Set(initialData.selectedTestCaseIds));
  const [query, setQuery] = useState(initialData.problem.slug);
  const [run, setRun] = useState<WorkbenchRunResponse | null>(null);
  const [review, setReview] = useState<WorkbenchReviewResponse | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>(initialData.chatMessages);
  const [lastToolTrace, setLastToolTrace] = useState<NonNullable<WorkbenchChatResponse["toolTrace"]>>([]);
  const [lastActionOutcomes, setLastActionOutcomes] = useState<NonNullable<WorkbenchChatResponse["actionOutcomes"]>>([]);
  const [customInput, setCustomInput] = useState("{}");
  const [customExpected, setCustomExpected] = useState("null");
  const [customLabel, setCustomLabel] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [busy, setBusy] = useState<"run" | "review" | "chat" | "custom" | "rating" | null>(null);
  const { getActiveSeconds, resetActiveTimer } = useActiveTimer(initialData.problem.slug);
  const firstAutosave = useRef(true);

  const selectedTests = useMemo(
    () => tests.filter((test) => selectedIds.has(test.id)),
    [selectedIds, tests],
  );
  const catalogOptions = useMemo(
    () => initialData.catalog.map((entry) => `${entry.number}. ${entry.title} (${entry.slug})`),
    [initialData.catalog],
  );

  useEffect(() => {
    if (firstAutosave.current) {
      firstAutosave.current = false;
      return;
    }
    setSaveStatus("unsaved");
    const timer = window.setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const response = await fetch("/api/workbench/draft", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            problemSlug: initialData.problem.slug,
            content: code,
            selectedTestCaseIds: [...selectedIds],
          }),
        });
        if (!response.ok) throw new Error("Draft autosave failed.");
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [code, initialData.problem.slug, selectedIds]);

  function resolveProblem() {
    const normalized = query.trim().toLowerCase();
    const match = initialData.catalog.find(
      (entry) => entry.slug === normalized || String(entry.number) === normalized || entry.title.toLowerCase() === normalized || `${entry.number}. ${entry.title} (${entry.slug})`.toLowerCase() === normalized,
    );
    if (!match) {
      setNotice("No Hot-150 problem matched that number, title, or slug.");
      return;
    }
    router.push(`/workbench?problem=${encodeURIComponent(match.slug)}`);
  }

  function toggleTest(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function addCustomTest() {
    setBusy("custom");
    setNotice(null);
    try {
      const input = JSON.parse(customInput) as unknown;
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Custom input must be a JSON object keyed by parameter name.");
      const expected = JSON.parse(customExpected) as unknown;
      const response = await fetch("/api/workbench/custom-tests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          problemSlug: initialData.problem.slug,
          label: customLabel.trim() || `Custom visible test ${tests.filter((test) => test.source === "custom").length + 1}`,
          input,
          expected,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string; testCase?: WorkbenchTestCase };
      if (!response.ok || !result.ok || !result.testCase) throw new Error(result.error ?? "Could not save the custom test.");
      const testCase = result.testCase;
      setTests((current) => [...current, testCase]);
      setSelectedIds((current) => new Set([...current, testCase.id]));
      setCustomLabel("");
      setNotice("Custom test saved in your local SQLite database and selected for the next run.");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not save the custom test.");
    } finally {
      setBusy(null);
    }
  }

  async function postRun(path: "/api/workbench/run" | "/api/coach/review") {
    if (!selectedTests.length) {
      setNotice("Select at least one visible or custom test before running.");
      return;
    }
    const kind = path === "/api/coach/review" ? "review" : "run";
    setBusy(kind);
    setNotice(null);
    try {
      const durationSeconds = getActiveSeconds();
      const response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ problemSlug: initialData.problem.slug, code, language: "Python", testCases: selectedTests, durationSeconds }),
      });
      const body = (await response.json()) as WorkbenchRunResponse | WorkbenchReviewResponse | { error: string };
      if (!response.ok || !("ok" in body)) throw new Error("error" in body ? body.error : `HTTP ${response.status}`);
      setRun(body);
      if ("coachReply" in body) {
        setReview(body);
        setNotice(body.coachProvider === "external" ? "Review used real Piston evidence and your configured LLM." : "Review used real Piston evidence and the built-in local Coach.");
      } else {
        setNotice("Real Python execution finished and was saved locally.");
      }
      setSaveStatus("saved");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Request failed.");
    } finally {
      setBusy(null);
    }
  }

  async function sendChat() {
    if (!chatMessage.trim() || busy) return;
    const message = chatMessage.trim();
    const optimisticId = `local-${Date.now()}`;
    setChatMessage("");
    setChatTurns((turns) => [...turns, { id: optimisticId, role: "user", text: message }]);
    setBusy("chat");
    setNotice(null);
    try {
      const response = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ problemSlug: initialData.problem.slug, message, code, language: "Python", testCases: selectedTests.length ? selectedTests : tests.slice(0, 1) }),
      });
      const body = (await response.json()) as WorkbenchChatResponse | { error: string };
      if (!response.ok || !("ok" in body)) throw new Error("error" in body ? body.error : `HTTP ${response.status}`);
      setChatTurns((turns) => [...turns, { id: body.assistantMessageId ?? `assistant-${Date.now()}`, role: "assistant", text: body.coachReply }]);
      setLastToolTrace(body.toolTrace ?? []);
      setLastActionOutcomes(body.actionOutcomes ?? []);
      setNotice(body.coachProvider === "external" ? `External Coach completed the turn${body.toolTrace?.length ? ` with ${body.toolTrace.length} tool call(s)` : ""}.` : "Built-in local Coach completed the turn.");
    } catch (cause) {
      setChatTurns((turns) => [...turns, { id: `error-${Date.now()}`, role: "assistant", text: cause instanceof Error ? cause.message : "Chat failed." }]);
    } finally {
      setBusy(null);
    }
  }

  async function recordRating(selfRating: "easy" | "hesitated" | "struggled" | "unsolved") {
    if (!review?.reviewAttemptId || !review.problemHistoryId) return;
    setBusy("rating");
    try {
      const response = await fetch("/api/planner/outcome", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planItemId: initialData.planItemId || undefined, reviewAttemptId: review.reviewAttemptId, problemHistoryId: review.problemHistoryId, selfRating }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) throw new Error(body.error ?? "Could not record your self-rating.");
      resetActiveTimer();
      setNotice("Self-rating saved. Today, Planner, History, and Profile now reflect this attempt.");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not record your self-rating.");
    } finally {
      setBusy(null);
    }
  }

  async function clearChat() {
    if (!window.confirm("Clear the visible chat history for this problem? Saved Reviews and explicit learning records are kept.")) return;
    setBusy("chat");
    try {
      const response = await fetch("/api/coach/chat/clear", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ problemSlug: initialData.problem.slug }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) throw new Error(body.error ?? "Could not clear chat history.");
      setChatTurns([]);
      setLastToolTrace([]);
      setLastActionOutcomes([]);
      setNotice("Chat history cleared. Review evidence and explicitly saved learning records were kept.");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not clear chat history.");
    } finally {
      setBusy(null);
    }
  }

  const executionDisabled = !initialData.pistonHealthy || busy !== null || selectedTests.length === 0;
  return (
    <AppShell
      currentProblemDifficulty={initialData.problem.difficulty}
      currentProblemLabel={`${initialData.problem.number}. ${initialData.problem.title}`}
      language="Python"
      onLanguageChange={() => undefined}
      onProblemQueryChange={setQuery}
      onProblemResolve={resolveProblem}
      problemQuery={query}
      resolutionMessage={notice}
    >
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar displayName={initialData.displayName} mode="overlay" />
        <main className="grid min-w-0 flex-1 gap-4 p-4 xl:grid-cols-[minmax(260px,0.75fr)_minmax(460px,1.35fr)_minmax(320px,0.95fr)]">
          <aside className="space-y-4 rounded-xl border bg-card p-4">
            <ProblemStatement problem={initialData.problem} />
            <div className="border-t pt-4">
              <label className="text-sm font-medium" htmlFor="catalog-list">Hot-150 catalog</label>
              <input className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm" id="catalog-list" list="hot150-options" onChange={(event) => setQuery(event.target.value)} value={query} />
              <datalist id="hot150-options">{catalogOptions.map((option) => <option key={option} value={option} />)}</datalist>
              <Button className="mt-2" onClick={resolveProblem} type="button" variant="outline">Open problem</Button>
            </div>
          </aside>

          <section className="space-y-4">
            <div className="rounded-xl border bg-card p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div><p className="font-semibold">Python draft</p><p className="text-xs text-muted-foreground">Autosaved to local SQLite.</p></div>
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-muted-foreground"><Save className="h-3.5 w-3.5" />{saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "Unsaved"}</span>
              </div>
              <CodeDraftEditor code={code} onChange={setCode} />
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-semibold"><TestTube2 className="h-4 w-4" />Visible tests</h3><span className="text-xs text-muted-foreground">{selectedTests.length}/{tests.length} selected</span></div>
              <div className="mt-3 grid gap-2">
                {tests.map((test) => <label className="flex cursor-pointer gap-3 rounded-md border p-3 text-xs" key={test.id}><input checked={selectedIds.has(test.id)} className="mt-0.5" onChange={() => toggleTest(test.id)} type="checkbox" /><span className="min-w-0"><span className="font-medium">{test.label} · {test.source === "custom" ? "your local test" : "public visible"}</span><code className="mt-1 block overflow-auto">{JSON.stringify(test.input)}</code><code className="block overflow-auto text-muted-foreground">expected: {JSON.stringify(test.expected)}</code></span></label>)}
              </div>
              <details className="mt-3 rounded-md border p-3">
                <summary className="cursor-pointer text-sm font-medium">Add a custom visible test</summary>
                <div className="mt-3 grid gap-2">
                  <input className="rounded-md border bg-background px-3 py-2 text-sm" onChange={(event) => setCustomLabel(event.target.value)} placeholder="Test label (optional)" value={customLabel} />
                  <textarea aria-label="Custom input JSON" className="min-h-20 rounded-md border bg-background p-2 font-mono text-xs" onChange={(event) => setCustomInput(event.target.value)} value={customInput} />
                  <textarea aria-label="Custom expected JSON" className="min-h-16 rounded-md border bg-background p-2 font-mono text-xs" onChange={(event) => setCustomExpected(event.target.value)} value={customExpected} />
                  <Button disabled={busy !== null} onClick={addCustomTest} type="button" variant="outline">{busy === "custom" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save custom test</Button>
                </div>
              </details>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button disabled={executionDisabled} onClick={() => postRun("/api/workbench/run")} type="button">{busy === "run" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}Run Code</Button>
              <Button disabled={executionDisabled} onClick={() => postRun("/api/coach/review")} type="button" variant="outline">{busy === "review" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}Review My Code</Button>
            </div>
            {notice ? <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm">{notice}</p> : null}
            <PistonStatus healthy={initialData.pistonHealthy} />
            {run ? <RunEvidence result={run} /> : null}
          </section>

          <aside className="space-y-4">
            <section className="rounded-xl border bg-card p-4">
              <p className="flex items-center gap-2 font-semibold"><Bot className="h-4 w-4" />Coach connection</p>
              {initialData.coachProviderStatus === "external" ? <p className="mt-2 text-sm text-emerald-700">Your OpenAI-compatible provider is active. Chat can call the permitted execution, catalog, memory, hint, and explicit-save tools.</p> : initialData.coachProviderStatus === "local" ? <p className="mt-2 text-sm text-muted-foreground">Built-in local Coach is active. Configure <code>LLM_BASE_URL</code>, <code>LLM_API_KEY</code>, and <code>LLM_MODEL</code> for model-powered Review and tool-calling Chat.</p> : <p className="mt-2 text-sm text-destructive">LLM configuration is incomplete. Set all three LLM variables and restart.</p>}
            </section>

            <section className="rounded-xl border bg-card p-4">
              <h3 className="font-semibold">Coach Review</h3>
              <div className="mt-3 min-h-24 text-sm">{review?.coachReply ? <CoachMarkdown markdown={review.coachReply} /> : <p className="text-muted-foreground">Run selected tests, then request a Review grounded in real execution evidence.</p>}</div>
              {review?.reviewAttemptId && review.problemHistoryId ? <div className="mt-4 border-t pt-3"><p className="text-xs font-medium">How did this attempt feel?</p><div className="mt-2 flex flex-wrap gap-2">{(["easy", "hesitated", "struggled", "unsolved"] as const).map((rating) => <Button disabled={busy !== null} key={rating} onClick={() => recordRating(rating)} size="sm" type="button" variant="outline">{rating}</Button>)}</div></div> : null}
            </section>

            <section className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">Coach Chat</h3><div className="flex items-center gap-2"><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Wrench className="h-3.5 w-3.5" />bounded tools</span><Button aria-label="Clear chat" disabled={busy !== null || chatTurns.length === 0} onClick={clearChat} size="icon" title="Clear chat" type="button" variant="ghost"><Trash2 className="h-4 w-4" /></Button></div></div>
              <div className="my-3 max-h-[420px] space-y-2 overflow-auto">
                {chatTurns.length ? chatTurns.map((turn) => <div className={`rounded-md p-3 text-sm ${turn.role === "user" ? "ml-6 bg-primary/10" : "mr-6 bg-muted"}`} key={turn.id}>{turn.role === "assistant" ? <CoachMarkdown markdown={turn.text} /> : turn.text}</div>) : <p className="text-sm text-muted-foreground">Ask about the current problem, request a real run, recall your history, or explicitly ask Coach to save a note.</p>}
              </div>
              {lastToolTrace.length ? <div className="mb-3 rounded-md border bg-muted/30 p-2 text-xs"><p className="font-medium">Tools used this turn</p>{lastToolTrace.map((tool) => <p className="mt-1" key={tool.toolCallId}>• {tool.name}</p>)}</div> : null}
              {lastActionOutcomes.length ? <div className="mb-3 grid gap-1">{lastActionOutcomes.map((outcome, index) => <p className="rounded-md border px-2 py-1 text-xs" key={`${outcome.toolName}-${index}`}>{outcome.displayName}: {outcome.message}</p>)}</div> : null}
              <textarea className="min-h-24 w-full rounded-md border bg-background p-2 text-sm" onChange={(event) => setChatMessage(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void sendChat(); }} placeholder="Ask Coach about this problem or your latest real run…" value={chatMessage} />
              <Button className="mt-2" disabled={!chatMessage.trim() || busy !== null} onClick={sendChat} type="button">{busy === "chat" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Send</Button>
            </section>
          </aside>
        </main>
      </div>
    </AppShell>
  );
}

function PistonStatus({ healthy }: { healthy: boolean }) {
  return healthy ? <p className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900"><CheckCircle2 className="h-4 w-4" />Local Piston is healthy. Run and Review execute real Python code.</p> : <p className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>Run and Review need local Piston. Start it with <code>npm run piston:up</code>, verify with <code>npm run piston:smoke</code>, then refresh.</span></p>;
}

function RunEvidence({ result }: { result: WorkbenchRunResponse }) {
  const run = result.runResult;
  return <div className="rounded-xl border bg-card p-4"><p className="flex items-center gap-2 font-semibold"><Clock3 className="h-4 w-4" />Real local execution evidence</p><p className="mt-2 text-sm">{summarizeRunEvidence(run)}</p><div className="mt-3 grid gap-2">{run.testResults.map((test) => <div className="rounded-md border p-2 text-xs" key={test.id}><p className="font-medium">{test.passed ? "✓" : "×"} {test.label}</p>{test.error ? <pre className="mt-1 overflow-auto text-destructive">{test.error}</pre> : null}</div>)}</div></div>;
}
