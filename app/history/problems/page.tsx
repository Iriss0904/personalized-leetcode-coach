import { Clock3, History, NotebookPen, Search, X } from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Donut } from "@/components/shared/donut";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TagChip } from "@/components/shared/tag-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AttemptsToAcChart } from "@/features/growth/attempts-to-ac-chart";
import { CategoryProgressBars } from "@/features/growth/category-progress-bars";
import { DailyActivityChart } from "@/features/growth/daily-activity-chart";
import {
  getProblemHistoryPageData,
  splitAttemptsByAge,
  type ProblemHistoryAttempt,
  type ProblemHistoryStatusFilter,
} from "@/features/problem-history/problem-history-data";
import {
  difficultyBadgeClass,
  runStatusBadgeClass,
  runStatusLabel,
} from "@/lib/ui-status";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ProblemHistoryPageProps = {
  searchParams?: Promise<{
    problem?: string;
    tag?: string;
    status?: string;
  }>;
};

const STATUS_TABS: Array<{ value: ProblemHistoryStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "failed", label: "Failed" },
  { value: "passed", label: "Passed" },
];

function parseStatus(value: string | undefined): ProblemHistoryStatusFilter {
  return value === "passed" || value === "failed" ? value : "all";
}

function withParams(base: {
  problem: string;
  tag: string;
  status: ProblemHistoryStatusFilter;
}) {
  const params = new URLSearchParams();
  if (base.problem) params.set("problem", base.problem);
  if (base.tag) params.set("tag", base.tag);
  if (base.status !== "all") params.set("status", base.status);
  const query = params.toString();
  return query ? `/history/problems?${query}` : "/history/problems";
}

export default async function ProblemHistoryPage({
  searchParams,
}: ProblemHistoryPageProps) {
  const params = await searchParams;
  const status = parseStatus(params?.status);
  const data = await getProblemHistoryPageData({
    problem: params?.problem,
    tag: params?.tag,
    status,
  });
  const difficultySegments = difficultyMixSegments(data.growth.difficultyMix);

  return (
    <AppLayout displayName={data.displayName}>
      <PageHeader
        title="Problem History"
        description="Your practice fact log: attempts, last traps, and visible progress by problem."
        actions={
          <div className="flex items-center rounded-full border border-border bg-card p-0.5">
            {STATUS_TABS.map((tab) => (
              <Link
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  data.filters.status === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                href={withParams({ ...data.filters, status: tab.value })}
                key={tab.value}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        }
      />

      <section className="mt-6 grid gap-4">
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-primary">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Avg Problem Time
              </p>
            </div>
            <p className="mt-4 text-3xl font-semibold">
              {formatDuration(data.growth.avgDurationSeconds)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Active time before Review, with idle gaps capped.
            </p>
          </div>
          <DailyActivityChart data={data.growth.dailyActivity} />
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <AttemptsToAcChart data={data.growth.attemptsToFirstAc} />
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Solved Difficulty Mix</h2>
            <p className="text-xs text-muted-foreground">Passed at least once</p>
            {difficultySegments.length > 0 ? (
              <div className="mt-4">
                <Donut segments={difficultySegments} size={104} />
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                Pass one Review to see the difficulty mix.
              </div>
            )}
          </div>
        </div>
        <CategoryProgressBars data={data.growth.categoryProgress} />
      </section>

      <form
        className="mt-6 grid gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-[1fr_1fr_auto_auto]"
        method="get"
      >
        <input name="status" type="hidden" value={data.filters.status} />
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Problem</span>
          <Input
            defaultValue={data.filters.problem}
            name="problem"
            placeholder="slug, title, or number"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Tag</span>
          <Input
            defaultValue={data.filters.tag}
            name="tag"
            placeholder="binary-search"
          />
        </label>
        <div className="flex items-end">
          <Button className="w-full" type="submit">
            <Search className="h-4 w-4" aria-hidden="true" />
            Filter
          </Button>
        </div>
        <div className="flex items-end">
          <Button asChild className="w-full" variant="outline">
            <Link href="/history/problems">
              <X className="h-4 w-4" aria-hidden="true" />
              Clear
            </Link>
          </Button>
        </div>
      </form>

      {data.availableTags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {data.availableTags.map((tag) => (
            <TagChip
              active={data.filters.tag === tag}
              href={withParams({
                ...data.filters,
                tag: data.filters.tag === tag ? "" : tag,
              })}
              key={tag}
              label={tag}
            />
          ))}
        </div>
      ) : null}

      <section className="mt-6 grid gap-4">
        {data.groups.length > 0 ? (
          data.groups.map((group) => {
            const { recent, older } = splitAttemptsByAge(group.attempts);
            return (
              <article
                className="rounded-lg border border-border bg-card"
                key={group.problem.id}
              >
                <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        className={runStatusBadgeClass(group.latest.runStatus)}
                        label={runStatusLabel(group.latest.runStatus)}
                      />
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          difficultyBadgeClass(group.problem.difficulty),
                        )}
                      >
                        {group.problem.difficulty ?? "Demo"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {group.problem.leetcodeNumber
                          ? `LC ${group.problem.leetcodeNumber}`
                          : "Local problem"}
                      </span>
                    </div>
                    <h2 className="mt-2 truncate text-base font-semibold">
                      {group.problem.title}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last attempt {formatRelativeTime(group.latest.createdAt)}
                    </p>
                    <p className="mt-3 text-sm leading-6">
                      {group.latest.userIssueSummary || "No user issue recorded."}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 lg:w-56 lg:items-end">
                    <p className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium">
                      {firstAcLabel(group.firstAcAttemptCount, group.attempts.length)}
                    </p>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/workbench?problem=${group.problem.slug}`}>
                          <History className="h-4 w-4" aria-hidden="true" />
                          Restore Workspace
                        </Link>
                      </Button>
                      {group.latest.hasFlashcard ? (
                        <Button asChild size="sm" variant="ghost">
                          <Link href="/notebook">
                            <NotebookPen className="h-4 w-4" aria-hidden="true" />
                            Mistake Book
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
                <details className="border-t border-border">
                  <summary className="cursor-pointer px-5 py-3 text-sm font-semibold">
                    All attempts ({group.attempts.length})
                  </summary>
                  <div className="grid gap-3 border-t border-border p-3">
                    {recent.map((attempt) => (
                      <AttemptRow attempt={attempt} key={attempt.id} />
                    ))}
                    {older.length > 0 ? (
                      <details className="rounded-md border border-border bg-background">
                        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                          View earlier ({older.length})
                        </summary>
                        <div className="grid gap-3 border-t border-border p-3">
                          {older.map((attempt) => (
                            <AttemptRow attempt={attempt} key={attempt.id} />
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                </details>
              </article>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card px-4 py-10 text-sm text-muted-foreground">
            No problem history matches the current filters.
          </div>
        )}
      </section>
    </AppLayout>
  );
}

function AttemptRow({ attempt }: { attempt: ProblemHistoryAttempt }) {
  return (
    <div className="grid gap-3 rounded-md border border-border bg-background p-3 text-sm lg:grid-cols-[180px_90px_110px_minmax(0,1fr)_minmax(0,1fr)_72px]">
      <Fact label="Time" value={formatDateTime(attempt.createdAt)} />
      <Fact label="Language" value={attempt.language} />
      <Fact label="Status" value={runStatusLabel(attempt.runStatus)} />
      <Fact label="Failed Case" value={attempt.failedCaseSummary || "—"} />
      <Fact label="User Issue" value={attempt.userIssueSummary || "—"} />
      <Fact label="Duration" value={formatDuration(attempt.durationSeconds)} />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate leading-6" title={value}>
        {value}
      </p>
    </div>
  );
}

function difficultyMixSegments(mix: { Easy: number; Medium: number; Hard: number }) {
  return [
    { label: "Easy", value: mix.Easy },
    { label: "Medium", value: mix.Medium },
    { label: "Hard", value: mix.Hard },
  ].filter((segment) => segment.value > 0);
}

function firstAcLabel(firstAcAttemptCount: number | null, attempts: number) {
  if (firstAcAttemptCount === null) {
    return `${attempts} attempt${attempts === 1 ? "" : "s"}, not passed yet`;
  }
  return `Passed on attempt ${firstAcAttemptCount}`;
}

function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return "—";
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return restSeconds === 0 ? `${minutes}m` : `${minutes}m ${restSeconds}s`;
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
