"use client";

import { Save, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { categoryLabel } from "./handbook-markdown";

const categories = ["python_api", "algo_template", "stdlib", "general"] as const;

export type EditableFields = {
  title: string;
  snippet: string;
  whenToUse: string;
  category: string;
};

export type CreateNoteFields = EditableFields & {
  conceptKey: string;
};

export function CreateNoteForm({
  onCancel,
  onCreate,
  pending,
}: {
  onCancel: () => void;
  onCreate: (note: CreateNoteFields) => void;
  pending: boolean;
}) {
  const [draft, setDraft] = useState<CreateNoteFields>({
    conceptKey: "",
    title: "",
    snippet: "",
    whenToUse: "",
    category: "python_api",
  });

  return (
    <section className="rounded-md border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">New Note</h2>
      <label className="mt-3 grid gap-1 text-sm">
        <span className="font-medium">conceptKey</span>
        <input
          className="rounded-md border border-border bg-background px-3 py-2"
          onChange={(e) =>
            setDraft((current) => ({ ...current, conceptKey: e.target.value }))
          }
          value={draft.conceptKey}
        />
      </label>
      <NoteFields
        draft={draft}
        onChange={(fields) => setDraft((current) => ({ ...current, ...fields }))}
      />
      <div className="mt-3 flex gap-2">
        <Button disabled={pending} onClick={() => onCreate(draft)} size="sm">
          <Save className="h-4 w-4" aria-hidden="true" />
          Save
        </Button>
        <Button onClick={onCancel} size="sm" type="button" variant="ghost">
          <X className="h-4 w-4" aria-hidden="true" />
          Cancel
        </Button>
      </div>
    </section>
  );
}

export function NoteFields({
  draft,
  onChange,
}: {
  draft: EditableFields;
  onChange: (draft: EditableFields) => void;
}) {
  return (
    <div className="mt-3 grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Title</span>
        <input
          className="rounded-md border border-border bg-background px-3 py-2"
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          value={draft.title}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Category</span>
        <select
          className="rounded-md border border-border bg-background px-3 py-2"
          onChange={(e) => onChange({ ...draft, category: e.target.value })}
          value={draft.category}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Snippet</span>
        <textarea
          className="min-h-32 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs leading-5"
          onChange={(e) => onChange({ ...draft, snippet: e.target.value })}
          value={draft.snippet}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">When to use</span>
        <input
          className="rounded-md border border-border bg-background px-3 py-2"
          onChange={(e) => onChange({ ...draft, whenToUse: e.target.value })}
          value={draft.whenToUse}
        />
      </label>
    </div>
  );
}
