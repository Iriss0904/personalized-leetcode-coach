"use client";

import Link from "next/link";
import { Copy, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";

export type HandbookHomeNote = {
  id: string;
  title: string;
  snippet: string;
  lookupCount: number;
};

export function HandbookHomeCard({ notes }: { notes: HandbookHomeNote[] }) {
  const visibleNotes = notes.slice(0, 3);

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <NotebookPen className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Knowledge Handbook</h2>
        </span>
        <Button asChild size="sm" variant="outline">
          <Link href="/handbook">View All</Link>
        </Button>
      </div>
      <div className="mt-3 grid gap-2">
        {visibleNotes.length > 0 ? (
          visibleNotes.map((note) => <HandbookHomeRow key={note.id} note={note} />)
        ) : (
          <p className="rounded-md border border-dashed border-border px-3 py-5 text-sm text-muted-foreground">
            API, syntax, and template notes saved by Coach will appear here.
          </p>
        )}
      </div>
      {notes.length > 0 ? (
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
          Frequently revisited knowledge is worth reviewing before an interview.
        </p>
      ) : null}
    </section>
  );
}

function HandbookHomeRow({ note }: { note: HandbookHomeNote }) {
  return (
    <article className="rounded-md border border-border bg-muted/20 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{note.title}</span>
        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
          Looked up {note.lookupCount} {note.lookupCount === 1 ? "time" : "times"}
        </span>
      </div>
      <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap break-words rounded bg-background/70 p-2 font-mono text-xs leading-5 text-muted-foreground">
        {note.snippet}
      </pre>
      <button
        className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        onClick={() => navigator.clipboard.writeText(note.snippet)}
        type="button"
      >
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        Copy
      </button>
    </article>
  );
}
