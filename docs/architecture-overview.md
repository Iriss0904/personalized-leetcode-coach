# Architecture overview

PatternCoach AI uses a small local-first architecture:

```text
Next.js UI
  → API routes
    → Coach (built-in local guidance or user-configured OpenAI-compatible provider)
    → Python code runner → localhost Piston
    → deterministic Planner
    → Memory retrieval → SQLite relational data + FTS5
```

The public Hot-150 bank contains only catalog metadata and execution-required Python contracts: method signatures, typed I/O schemas, serialization adapters, comparison strategies, and independently authored synthetic visible tests. It does not bundle official problem statements, hidden cases, reference solutions, or private content sources.

Real run evidence is created only by Piston; public v0.1 has no simulated run path. Coach Chat uses a bounded OpenAI-compatible tool loop for execution, catalog lookup, progressive hints, local history, FTS5 memory retrieval, and explicitly authorized durable writes. Durable Profile, Memory, Handbook, and Mistake Book writes require a direct UI action or an explicit user request/confirmation.

SQLite is the source of truth. FTS5 is a rebuildable lexical index used with deterministic facts and recent local episodes; no vector store is used.
