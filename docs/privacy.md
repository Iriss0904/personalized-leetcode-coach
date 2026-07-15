# Privacy and local data

PatternCoach AI is designed for local use.

- Learner profiles, drafts, code, chat, run evidence, history, notes, and planner state are stored in the SQLite file configured by `DATABASE_URL`.
- Submitted code is sent to the Piston URL you configure. The provided compose service listens only on localhost.
- Coach messages are sent outside your computer only when you configure an external OpenAI-compatible provider. That provider receives the current message and draft, limited relevant local context, available tool definitions, and the results of tools it requests for that turn.
- The public repository contains no user database, logs, API keys, LeetCode credentials, or real learner records.

Keep `.env.local` private. Before sharing diagnostics, remove code, chat content, database files, and environment values. Stop the app before backing up or deleting SQLite so its WAL companion files remain consistent.

The WebUI and bundled Piston compose service bind to localhost and have no login system. Do not expose ports 3000 or 2000 through a tunnel, reverse proxy, router, or public network.

PatternCoach does not simulate execution. Only evidence returned by the configured Piston service may update run, review, history, or learning records. Draft and custom-test saves use ordinary API routes so Next.js development logs do not print their request bodies.
