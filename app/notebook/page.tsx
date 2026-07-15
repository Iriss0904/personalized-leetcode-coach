import { BookOpenCheck, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/shared/page-header";
import {
  loadNotebookData,
  type NotebookData,
  type NotebookProblemGroup,
} from "@/features/notebook/notebook-data";
import { NotebookExportButton } from "@/features/notebook/notebook-export-button";
import { ReviewProblemCardView } from "@/features/review-problems/review-problem-card";

export const dynamic = "force-dynamic";

export default async function NotebookPage() {
  const data = await loadNotebookData();

  return (
    <AppLayout displayName={data.displayName}>
      <PageHeader
        actions={<NotebookExportButton markdown={data.markdown} />}
        description="A problem-centered review library: common traps explain what went wrong, while Review and self-check cards guide the next attempt."
        title="Mistake Book"
      />
      <ProblemLibrarySection data={data} />
      <ResolvedSection data={data} />
    </AppLayout>
  );
}

function ProblemLibrarySection({ data }: { data: NotebookData }) {
  const count = data.groups.reduce((total, group) => total + group.cards.length, 0);

  return (
    <section className="mt-6 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="flex items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Problems to Revisit</h2>
        </span>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="grid gap-5 px-5 py-4">
        {data.groups.length > 0 ? (
          data.groups.map((group) => (
            <NotebookGroup group={group} key={group.tag} />
          ))
        ) : (
          <p className="rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
            No problems need another attempt yet. Problems with a diagnosed trap will appear here after Review.
          </p>
        )}
      </div>
    </section>
  );
}

function NotebookGroup({ group }: { group: NotebookProblemGroup }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          {group.tag}
        </h3>
        <span className="text-xs text-muted-foreground">
          {group.cards.length}
        </span>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {group.cards.map((card) => (
          <ReviewProblemCardView card={card} key={card.problemId} />
        ))}
      </div>
    </div>
  );
}

function ResolvedSection({ data }: { data: NotebookData }) {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Resolved Problems</h2>
        </span>
        <span className="text-xs text-muted-foreground">
          {data.resolved.length}
        </span>
      </div>
      <div className="grid gap-2 px-5 py-4 lg:grid-cols-2">
        {data.resolved.length > 0 ? (
          data.resolved.map((card) => (
            <ReviewProblemCardView card={card} key={card.problemId} resolved />
          ))
        ) : (
          <p className="rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground lg:col-span-2">
            Problems you struggled with and later fixed will appear here after a successful Review.
          </p>
        )}
      </div>
    </section>
  );
}
