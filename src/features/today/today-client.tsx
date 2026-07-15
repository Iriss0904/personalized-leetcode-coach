"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  ListChecks,
  Loader2,
  Play,
  SkipForward,
  Target,
  Trophy,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReviewProblemCardView } from "@/features/review-problems/review-problem-card";
import { cn } from "@/lib/utils";
import type {
  PlannerCoverage,
  TodayDoseItem,
  TodayPlannerData,
} from "@/server/planner/planner.types";
import {
  HandbookHomeCard,
  type HandbookHomeNote,
} from "./handbook-home-card";

export function TodayClient({
  initialData,
  handbookNotes,
}: {
  initialData: TodayPlannerData;
  handbookNotes: HandbookHomeNote[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [skipId, setSkipId] = useState<string | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  async function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSavingGoal(true);
    setError("");
    try {
      const response = await fetch("/api/planner/goal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) throw new Error(body.error ?? "Could not save the local plan.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the local plan.");
    } finally {
      setSavingGoal(false);
    }
  }

  async function openDose(item: TodayDoseItem) {
    if (item.status === "completed") {
      router.push(workbenchHref(item));
      return;
    }
    setBusyId(item.planItemId);
    setError("");
    try {
      const response = await fetch("/api/planner/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planItemId: item.planItemId }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) throw new Error(body.error ?? "Could not open this plan item.");
      router.push(workbenchHref(item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open this plan item.");
      setBusyId(null);
    }
  }

  async function skipDose(item: TodayDoseItem) {
    setSkipId(item.planItemId);
    setError("");
    try {
      const response = await fetch("/api/planner/skip", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planItemId: item.planItemId }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) throw new Error(body.error ?? "Could not defer this plan item.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not defer this plan item.");
    } finally {
      setSkipId(null);
    }
  }

  async function continueDose() {
    setAdvancing(true);
    setError("");
    try {
      const response = await fetch("/api/planner/advance-dose", { method: "POST" });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) throw new Error(body.error ?? "Could not continue to the next dose.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not continue to the next dose.");
    } finally {
      setAdvancing(false);
    }
  }

  if (!initialData.hasGoal) {
    return (
      <>
        <PageHeader
          description="Tell PatternCoach your interview date and weekly study time. Your plan stays in local SQLite."
          title="Today"
        />
        <section className="mt-6 rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 text-primary">
            <Target className="h-4 w-4" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Build your Hot-150 plan</h2>
          </div>
          <form className="mt-5 grid gap-4 md:grid-cols-[1fr_180px_150px_auto]" onSubmit={saveGoal}>
            <Field label="Target">
              <Input defaultValue={initialData.defaultTargetLabel} name="targetLabel" required />
            </Field>
            <Field label="Interview date">
              <Input defaultValue={initialData.defaultInterviewDate} name="interviewDate" required type="date" />
            </Field>
            <Field label="Hours / week">
              <Input defaultValue={initialData.defaultWeeklyHours} min={1} name="weeklyHours" required step="0.5" type="number" />
            </Field>
            <div className="flex items-end">
              <Button disabled={savingGoal} type="submit">
                {savingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
                Create local plan
              </Button>
            </div>
          </form>
          {error ? <ErrorNotice text={error} /> : null}
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        actions={<Button asChild variant="outline"><Link href="/workbench">Open Workbench</Link></Button>}
        description="Your deterministic Hot-150 schedule, review queue, and local learning progress."
        title="Today"
      />

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_0.7fr_1fr]">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Readiness target</p>
              <h2 className="mt-2 text-2xl font-semibold">{initialData.goal.targetLabel}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {initialData.goal.weeklyHours}h/week · {initialData.goal.dailyDoseTarget} problem{initialData.goal.dailyDoseTarget === 1 ? "" : "s"} per dose
              </p>
            </div>
            <div className="rounded-md border bg-muted/25 px-4 py-3 text-right">
              <p className="text-xs text-muted-foreground">Interview</p>
              <p className="font-semibold">{formatDate(initialData.goal.interviewDate)}</p>
              <p className="text-xs text-muted-foreground">{initialData.goal.daysRemaining} days left</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Pace rule</h2></div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Weekly time is converted into a capped daily dose using a transparent 45-minute estimate.</p>
        </div>
        <PatternCoverage patterns={initialData.coverage.patternCoverage} />
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        <Metric icon={<Flame className="h-9 w-9 text-orange-500" />} label="Study streak" value={initialData.growth.streakDays} detail="days with Review activity" />
        <Metric icon={<CalendarDays className="h-9 w-9 text-blue-500" />} label="This week" value={initialData.growth.weeklyProblemCount} detail="distinct problems practiced" />
        <Metric icon={<Trophy className="h-9 w-9 text-amber-500" />} label="Solved / Hot-150" value={`${initialData.growth.solvedCount} / ${initialData.growth.top150Total}`} detail="passed with real execution" />
      </section>

      {error ? <ErrorNotice text={error} /> : null}
      <section className="mt-6 grid items-start gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="rounded-lg border bg-card">
          <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
            <div><div className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /><h2 className="font-semibold">Today dose</h2></div>
            <p className="mt-1 text-xs text-muted-foreground">Unfinished work remains in your queue. Skip moves an item to a later day.</p>
            </div>
            {initialData.dose.length > 0 && initialData.dose.every((item) => item.status === "completed") ? <Button disabled={advancing} onClick={continueDose} size="sm" type="button">{advancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}Next dose</Button> : null}
          </div>
          <div className="divide-y">
            {initialData.dose.length ? initialData.dose.map((item) => (
              <DoseRow busy={busyId === item.planItemId} item={item} key={item.planItemId} onOpen={openDose} onSkip={skipDose} skipping={skipId === item.planItemId} />
            )) : <p className="px-5 py-8 text-sm text-muted-foreground">Nothing is due today. Open Workbench for free practice.</p>}
          </div>
        </div>

        <aside className="grid gap-4">
          <section className="rounded-lg border bg-card">
            <div className="border-b px-5 py-3"><h2 className="text-sm font-semibold">Review focus</h2></div>
            <div className="grid gap-3 p-4">
              {initialData.reviewFocus.cards.length ? initialData.reviewFocus.cards.map((card) => <ReviewProblemCardView card={card} key={card.problemId} />) : <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Failed or hesitant Reviews will appear here for another attempt.</p>}
            </div>
          </section>
          <HandbookHomeCard notes={handbookNotes} />
        </aside>
      </section>
    </>
  );
}

function DoseRow({ busy, item, onOpen, onSkip, skipping }: { busy: boolean; item: TodayDoseItem; onOpen: (item: TodayDoseItem) => void; onSkip: (item: TodayDoseItem) => void; skipping: boolean }) {
  const complete = item.status === "completed";
  return (
    <article className={cn("grid gap-3 border-l-4 px-5 py-4 md:grid-cols-[1fr_auto]", complete ? "border-l-emerald-500" : "border-l-primary")}>
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border bg-muted/30 px-2 py-0.5">{item.source === "plan" ? "New" : item.source}</span>
          <span className="rounded-full border px-2 py-0.5">{item.difficulty}</span>
          <span className="text-muted-foreground">LC {item.leetcodeNumber}</span>
        </div>
        <h3 className="mt-2 font-semibold">{item.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{item.why[0]?.detail ?? "Scheduled from your local Hot-150 plan."}</p>
        <p className="mt-2 text-xs text-muted-foreground">{item.tags.slice(0, 4).join(" · ")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {complete ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" />Done</span> : null}
        {!complete ? <Button disabled={busy || skipping} onClick={() => onSkip(item)} size="sm" type="button" variant="ghost">{skipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <SkipForward className="h-4 w-4" />}Skip</Button> : null}
        <Button disabled={busy || skipping} onClick={() => onOpen(item)} size="sm" type="button" variant={complete ? "outline" : "default"}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{complete ? "Review again" : item.status === "in_progress" ? "Continue" : "Start"}</Button>
      </div>
    </article>
  );
}

function PatternCoverage({ patterns }: { patterns: PlannerCoverage["patternCoverage"] }) {
  return <div className="rounded-lg border bg-card p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Pattern coverage</h2><Link className="text-xs text-primary hover:underline" href="/profile">View profile</Link></div><div className="mt-4 grid gap-3">{patterns.map((pattern) => { const percent = Math.round(pattern.completed / Math.max(pattern.total, 1) * 100); return <div key={pattern.tag}><div className="flex justify-between text-xs"><span className="truncate">{pattern.tag}</span><span className="text-muted-foreground">{pattern.completed}/{pattern.total}</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${percent}%` }} /></div></div>; })}</div></div>;
}

function Metric({ detail, icon, label, value }: { detail: string; icon: ReactNode; label: string; value: string | number }) {
  return <div className="flex items-center gap-4 rounded-lg border bg-card p-4"><div>{icon}</div><div><p className="text-xs font-medium uppercase text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div></div>;
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="grid gap-1 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}

function ErrorNotice({ text }: { text: string }) {
  return <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{text}</p>;
}

function workbenchHref(item: TodayDoseItem) {
  return `/workbench?problem=${encodeURIComponent(item.slug)}&planItemId=${encodeURIComponent(item.planItemId)}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
