"use client";

import {
  Archive,
  Copy,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { categoryLabel, type HandbookNote } from "./handbook-markdown";
import {
  CreateNoteForm,
  NoteFields,
  type EditableFields,
} from "./handbook-note-form";

export function HandbookClient({
  initialEditId,
  notes,
}: {
  initialEditId: string | null;
  notes: HandbookNote[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(initialEditId);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => filterNotes(notes, query), [notes, query]);
  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);

  function mutate(path: string, body: unknown, after?: () => void) {
    setError(null);
    startTransition(() => {
      void post(path, body)
        .then(() => {
          after?.();
          router.refresh();
        })
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : "Request failed."),
        );
    });
  }

  return (
    <div className="mt-6 grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="relative block min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search concepts, snippets, or use cases"
            value={query}
          />
        </label>
        <Button
          onClick={() => setIsCreating(true)}
          type="button"
          variant="outline"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New
        </Button>
      </div>
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {isCreating ? (
        <CreateNoteForm
          onCancel={() => setIsCreating(false)}
          onCreate={(note) =>
            mutate("/api/handbook/create", note, () => setIsCreating(false))
          }
          pending={pending}
        />
      ) : null}
      {filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-8 text-sm text-muted-foreground">
          No matching notes.
        </p>
      ) : (
        Array.from(grouped).map(([category, group]) => (
          <section className="grid gap-2" key={category}>
            <h2 className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {categoryLabel(category)}
            </h2>
            {group.map((note) => (
              <HandbookEntry
                editing={editingId === note.id}
                key={`${note.id}-${editingId === note.id ? "edit" : "view"}`}
                note={note}
                onArchive={() =>
                  mutate("/api/handbook/archive", { noteId: note.id })
                }
                onDelete={() =>
                  mutate("/api/handbook/delete", { noteId: note.id })
                }
                onEdit={() => setEditingId(note.id)}
                onSave={(patch) =>
                  mutate("/api/handbook/update", { noteId: note.id, patch }, () =>
                    setEditingId(null),
                  )
                }
                pending={pending}
                stopEditing={() => setEditingId(null)}
              />
            ))}
          </section>
        ))
      )}
    </div>
  );
}

function HandbookEntry({
  editing,
  note,
  onArchive,
  onDelete,
  onEdit,
  onSave,
  pending,
  stopEditing,
}: {
  editing: boolean;
  note: HandbookNote;
  onArchive: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSave: (patch: EditableFields) => void;
  pending: boolean;
  stopEditing: () => void;
}) {
  const [draft, setDraft] = useState<EditableFields>(note);

  return (
    <article className="rounded-md border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{note.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            When to use: {note.whenToUse}
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
          Looked up {note.lookupCount} {note.lookupCount === 1 ? "time" : "times"}
        </span>
      </div>
      {editing ? (
        <NoteFields draft={draft} onChange={setDraft} />
      ) : (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-muted/35 p-3 font-mono text-xs leading-5">
          {note.snippet}
        </pre>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {editing ? (
          <>
            <Button disabled={pending} onClick={() => onSave(draft)} size="sm">
              <Save className="h-4 w-4" aria-hidden="true" />
              Save
            </Button>
            <Button
              onClick={stopEditing}
              size="sm"
              type="button"
              variant="ghost"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </Button>
          </>
        ) : (
          <>
            <IconTextButton
              icon={Copy}
              label="Copy"
              onClick={() => navigator.clipboard.writeText(note.snippet)}
            />
            <IconTextButton icon={Pencil} label="Edit" onClick={onEdit} />
            <IconTextButton
              disabled={pending}
              icon={Archive}
              label="Learned"
              onClick={onArchive}
            />
            <IconTextButton
              danger
              disabled={pending}
              icon={Trash2}
              label="Delete"
              onClick={onDelete}
            />
          </>
        )}
      </div>
    </article>
  );
}

function IconTextButton({
  danger,
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  danger?: boolean;
  disabled?: boolean;
  icon: typeof Copy;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={
        danger
          ? "inline-flex items-center gap-1 text-xs text-destructive hover:underline"
          : "inline-flex items-center gap-1 text-xs text-primary hover:underline"
      }
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

async function post(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error("Request failed.");
  }
}

function filterNotes(notes: HandbookNote[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return notes;
  }
  return notes.filter((note) =>
    `${note.title} ${note.snippet} ${note.whenToUse}`.toLowerCase().includes(q),
  );
}

function groupByCategory(notes: HandbookNote[]) {
  const grouped = new Map<string, HandbookNote[]>();
  for (const note of notes) {
    grouped.set(note.category, [...(grouped.get(note.category) ?? []), note]);
  }
  return grouped;
}
