# PatternCoach AI

> Your coding history should coach you back.

PatternCoach AI is a local, Python-only practice workbench for the LeetCode Hot Interview 150 catalog. It combines real local code execution with short Coach feedback, a deterministic study planner, and learning records stored on your own computer.

## What v0.1 includes

- Browse and open all 150 Hot Interview problems using safe catalog metadata and links to the original pages.
- Execute Python solutions for all 150 through your own local Piston service.
- Add custom visible tests, save drafts, and review real Piston evidence.
- Use the clearly labeled built-in local Coach or configure your own OpenAI-compatible provider.
- Let a configured external Coach call bounded tools for real code execution, catalog search, progressive hints, mistake history, FTS5 memory recall, and explicitly authorized saves.
- Keep a local Profile, Today plan, Problem History, Chat History, Mistake Book, and Knowledge Handbook.
- Retrieve deterministic local facts with SQLite FTS5 and recent learning history.

This is not an online judge. `Review My Code` evaluates only the selected public visible tests; it never claims hidden-test or official LeetCode acceptance.

## Requirements

- Node.js 20.19+, 22.12+, or 24+
- npm
- Python 3 (for the public contract validation command)
- Docker Desktop or Docker Engine
- About 2 GB of free memory for the local Piston service
- About 1.5 GB of free disk space for the pinned Python runtime

## Quick start

The application always uses real local Piston execution. It never simulates a run or creates fake execution evidence.

```bash
npm ci
npm run setup
npm run piston:up
npm run piston:install -- --confirm
npm run setup:piston
npm run piston:smoke
npm run doctor
npm run dev
```

Open <http://localhost:3000>, create your local Profile, select any Hot-150 problem, and run Python against the visible tests. `Run Code` is enabled once Piston reports a healthy Python runtime.

`setup:piston` checks reachability and the pinned Python 3.12.0 runtime. It does not download runtimes. A fresh Piston volume starts without language runtimes, so the confirmation-gated install command in Quick start performs a one-time download. In the release validation environment, it used about 1.1 GB of disk; actual usage can vary by image and platform.

```bash
npm run piston:install -- --confirm
```

Piston executes untrusted code in a privileged local container. The compose file binds only to `127.0.0.1`; do not expose port 2000 to a public network. Stop it with `npm run piston:down` when finished.

The pinned Piston image is currently `linux/amd64`. It was verified on x86_64; ARM64 and Apple Silicon require Docker's amd64 emulation and are not yet part of the verified v0.1 platform set.

## Optional OpenAI-compatible Coach

The built-in local Coach works without a key and is visibly labeled in the Workbench. For model-powered Review and Chat, set all three values:

```dotenv
LLM_BASE_URL=https://your-provider.example/v1
LLM_API_KEY=your_api_key_here
LLM_MODEL=your_model_name
```

Secrets belong only in `.env.local`. The app does not need LeetCode cookies, Session, CSRF, remote submission, or history-import credentials.

Restart the app, then verify both connectivity and OpenAI-compatible function-tool support with:

```bash
npm run coach:smoke
```

If an external provider is configured but unreachable, PatternCoach reports the configuration error; it does not silently present a local fallback as an external LLM response.

## Typical workflow

1. Create your local Profile.
2. Set an interview date and weekly hours on Today.
3. Open any of the 150 catalog problems.
4. Read the original problem on LeetCode, then write Python in Workbench.
5. Run independently authored public visible tests or your own custom visible tests in local Piston.
6. Choose `Review My Code` to ground feedback in that real evidence.
7. Continue with Coach Chat and explicitly request any durable Memory, Handbook, or Mistake Book write.

## Local data

The default database is `data/patterncoach.db`. SQLite WAL companion files can appear beside it while the app is running. These files are ignored by Git.

- Backup: stop the app, then copy the database and any current `-wal`/`-shm` companions together.
- Clear: stop the app and Piston, remove the local `data/` directory, then run `npm run setup` again.
- No real database or learner record is included in this repository; setup creates the public Hot-150 runtime records, and the first-run Onboarding creates your Profile.

## Useful commands

```bash
npm run dev              # Web UI at http://localhost:3000
npm run build            # production build
npm run start            # serve the production build
npm run setup            # local env + database initialization
npm run setup:piston     # non-installing Piston health check
npm run piston:boundary-smoke # syntax/runtime-error/timeout probes
npm run doctor           # user-facing diagnostics
npm run coach:smoke      # opt-in real LLM provider check
npm run test:smoke       # small public smoke suite
npm run validate:hot150  # validate all 150 public Python contracts
npm run verify:hot150:piston # execute all 150 contract harnesses in Piston
```

## Architecture

```text
Web UI → Next.js API → Coach / Python Runner / Memory / Planner
                              ↓              ↓
                         local Piston    SQLite + FTS5
```

See the [setup guide](docs/user-setup.md), [user guide](docs/user-guide.md), [troubleshooting guide](docs/troubleshooting.md), [architecture overview](docs/architecture-overview.md), and [privacy guide](docs/privacy.md).

## Current limits

- Python only; C++ is not included in public v0.1.
- Visible tests are synthetic public examples, not official or hidden tests.
- Problem statements and solutions are not bundled; use the original-problem links.
- No LeetCode account credentials, remote judge, automatic submission, or history import.
- No embedding, vector store, hybrid retrieval, or Mock Interview.
- Piston must be running with Python installed; there is no simulated execution fallback.

## Roadmap

Future public contributions may add separately reviewed visible tests, clearer execution contracts, accessibility improvements, and additional local diagnostics. Any new language or external-service integration requires its own security and content review.

## License and third-party notice

PatternCoach AI is licensed under `AGPL-3.0-only`. See [LICENSE](LICENSE) and [NOTICE](NOTICE). The license does not grant rights to redistribute LeetCode problem statements or other third-party content. LeetCode is a third-party trademark and is not affiliated with this project.
