import { z } from "zod";

export const chatToolNameSchema = z.enum([
  "run_current_code", "find_practice_problem", "get_algorithm_hint", "get_mistake_history", "recall_memory", "note_memory", "save_knowledge_note", "save_mistake_book_entry",
]);
export type ChatToolName = z.infer<typeof chatToolNameSchema>;
export const chatToolArgSchemas = {
  run_current_code: z.object({}),
  find_practice_problem: z.object({ query: z.string().default("") }),
  get_algorithm_hint: z.object({}),
  get_mistake_history: z.object({}),
  recall_memory: z.object({ query: z.string().default("") }),
  note_memory: z.object({ tag: z.string().min(1), value: z.string().min(1) }),
  save_knowledge_note: z.object({ conceptKey: z.string().min(1), title: z.string().min(1), snippet: z.string().min(1), whenToUse: z.string().min(1), category: z.string().default("general") }),
  save_mistake_book_entry: z.object({ title: z.string().min(1), guideMarkdown: z.string().min(1), tags: z.array(z.string()).default([]) }),
} satisfies Record<ChatToolName, z.ZodTypeAny>;
export type ChatToolArgs<T extends ChatToolName> = z.infer<(typeof chatToolArgSchemas)[T]>;
export type ChatToolResult<T extends ChatToolName> = { tool: T; ok: boolean; message: string; data?: unknown };

type PublicToolDefinition = {
  type: "function";
  function: {
    name: ChatToolName;
    description: string;
    parameters: Record<string, unknown>;
  };
};

const objectSchema = (
  properties: Record<string, unknown> = {},
  required: string[] = [],
) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

export const publicChatToolDefinitions: Record<
  ChatToolName,
  PublicToolDefinition
> = {
  run_current_code: {
    type: "function",
    function: {
      name: "run_current_code",
      description:
        "Run the learner's current Python draft against the currently selected visible tests in local Piston. Use only when execution evidence is useful or explicitly requested.",
      parameters: objectSchema(),
    },
  },
  find_practice_problem: {
    type: "function",
    function: {
      name: "find_practice_problem",
      description: "Find up to five safe Hot-150 catalog entries by title, slug, or number.",
      parameters: objectSchema(
        { query: { type: "string", description: "Catalog search text." } },
      ),
    },
  },
  get_algorithm_hint: {
    type: "function",
    function: {
      name: "get_algorithm_hint",
      description: "Get the next progressive hint for the active problem.",
      parameters: objectSchema(),
    },
  },
  get_mistake_history: {
    type: "function",
    function: {
      name: "get_mistake_history",
      description: "Read recent local Mistake Book entries for the active problem.",
      parameters: objectSchema(),
    },
  },
  recall_memory: {
    type: "function",
    function: {
      name: "recall_memory",
      description: "Retrieve focused local facts and recent learning episodes with SQLite FTS5.",
      parameters: objectSchema(
        { query: { type: "string", description: "What learner context to recall." } },
      ),
    },
  },
  note_memory: {
    type: "function",
    function: {
      name: "note_memory",
      description: "Save an explicit learner preference. Available only when the user explicitly asks to remember it.",
      parameters: objectSchema(
        {
          tag: { type: "string" },
          value: { type: "string" },
        },
        ["tag", "value"],
      ),
    },
  },
  save_knowledge_note: {
    type: "function",
    function: {
      name: "save_knowledge_note",
      description: "Save reusable knowledge to the Handbook. Available only on an explicit user request.",
      parameters: objectSchema(
        {
          conceptKey: { type: "string" },
          title: { type: "string" },
          snippet: { type: "string" },
          whenToUse: { type: "string" },
          category: { type: "string" },
        },
        ["conceptKey", "title", "snippet", "whenToUse"],
      ),
    },
  },
  save_mistake_book_entry: {
    type: "function",
    function: {
      name: "save_mistake_book_entry",
      description: "Save a problem-specific repair guide to the Mistake Book. Available only on an explicit user request.",
      parameters: objectSchema(
        {
          title: { type: "string" },
          guideMarkdown: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
        ["title", "guideMarkdown"],
      ),
    },
  },
};

export function publicChatToolsFor(names: ChatToolName[]) {
  return names.map((name) => publicChatToolDefinitions[name]);
}
