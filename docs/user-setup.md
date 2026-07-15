# PatternCoach AI Setup Guide

> Public v0.1. This guide is for people running PatternCoach AI on their own computer. It is not a contributor setup guide.

## 1. Start Here

The normal end-user installation includes the WebUI, local SQLite, Docker-based Piston, and Python 3.12.0. An external Coach is optional.

The complete local path is:

1. Install the Node.js dependencies.
2. Let the setup script create the local SQLite database.
3. Start the web app at <http://localhost:3000>.
4. Start local Piston and verify real Python execution.
5. Use the built-in local Coach, or optionally configure your own provider.

You may open the UI before Docker is ready, but that is a catalog/setup preview rather than a complete PatternCoach installation: Run and Review require real Piston execution.

An LLM API key is optional. LeetCode cookies are neither required nor supported by public v0.1.

This guide assumes that you:

- have obtained the PatternCoach AI source folder;
- can open a terminal in that folder;
- are comfortable copying a command and checking its result; or
- want Codex to handle the non-sensitive installation work for you.

> **Local-use security boundary:** PatternCoach public v0.1 has no login screen or multi-user access control. Keep it on a trusted computer and network. Do not forward ports 3000 or 2000, publish them through a tunnel, or expose them to the internet.

## 2. Choose Your Setup

### UI and catalog preview — not a complete installation

Use the **preview setup** only when you want to inspect the local UI before configuring Docker.

You get:

- the local Hot-150 catalog and visible tests;
- onboarding, planning, history, notes, and other local pages;
- Coach Chat with the clearly labeled built-in local Coach;
- local persistence in SQLite.

You do not get:

- Python execution;
- execution-grounded `Review My Code` feedback;
- hidden-test or LeetCode acceptance claims;
- model-generated coaching.

You need:

- Node.js and npm;
- no Docker;
- no account credential;
- no API key.

This is useful for setup diagnostics, but it is not the normal practice workflow. Continue to local Piston before evaluating Run, Review, learning records, or Coach evidence behavior.

### I want real local code execution

Add **local Piston** to the WebUI and SQLite bootstrap.

You get:

- real Python 3.12.0 execution in a local container;
- runs against the selected visible and custom tests;
- execution evidence saved to your local database;
- `Review My Code` with either the built-in local Coach or your external Coach.

You do not get:

- hidden LeetCode tests;
- remote submission or an accepted verdict;
- languages other than Python in public v0.1.

You additionally need:

- Docker Engine with Docker Compose, or Docker Desktop;
- permission to run the provided privileged Piston container;
- a one-time Python runtime download if the runtime store is fresh.

This is the required setup for normal PatternCoach use.

### I want richer AI coaching

Add an **external OpenAI-compatible Coach provider**.

You get:

- model-powered Review and Coach Chat responses;
- coaching based on the current problem, draft, recent local context, and—during Review—real visible-test evidence.

You additionally need:

- an account with a provider that offers an OpenAI-compatible Chat Completions API;
- that provider's base URL, API key, and exact model identifier.

The provider is optional. PatternCoach remains usable with the built-in deterministic local Coach when all three LLM settings are blank.

### I want LeetCode account integration

Public v0.1 does **not** contain LeetCode account integration. There is no Session or CSRF configuration step, no history import, and no remote submit path.

You can still use the local Hot-150 catalog, synthetic visible tests, and links to public problem pages. Do not place LeetCode cookies in `.env.local` or send them to an installer.

## 3. What You Provide vs. What We Prepare

### YOU DO THIS — choices and credentials you control

- Install a compatible Node.js release and npm.
- Install Docker-based code execution for the complete Run/Review workflow.
- Approve the Python runtime download only if the real smoke test reports it missing.
- Complete or skip the in-app learner profile.
- Optionally obtain an LLM base URL, API key, and model name from your provider.
- Enter any API key yourself in the local `.env.local` file.
- Keep the source folder, `.env.local`, database, and backups private.

### AUTOMATED — project scripts or Codex can do this

- `npm ci` installs the exact JavaScript dependencies from `package-lock.json`.
- `npm run setup` creates `.env.local` from the safe example when the file is absent.
- The same setup command creates the database directory, generates the Prisma client, applies the public baseline schema to a new database, enables SQLite WAL mode, seeds 150 public problem contracts, and creates the FTS5 search index.
- `npm run piston:up` pulls and starts the pinned Piston container.
- `npm run piston:smoke` checks the required runtime and executes real Python.
- `npm run doctor` checks Node.js, the Hot-150 bank, SQLite, Coach configuration, Piston reachability, and Python runtime availability.

### NOT AUTOMATIC — important limits

- `npm run setup` does not install Node.js or run `npm ci`.
- It does not start Docker or Piston.
- It does not download the Python runtime.
- It does not configure an LLM account.
- It does not connect a LeetCode account.
- It is not a general database upgrader for future releases.
- There is no application-wide reset or update command in public v0.1.

<details>
<summary>Dependency map</summary>

### A. Required to bootstrap the WebUI and local data

- A supported Node.js runtime: Node 20.19+, Node 22.12+, or Node 24+.
- npm, included with a normal Node.js installation.
- The source folder with `package.json` and `package-lock.json`.
- JavaScript dependencies installed with `npm ci`.
- The local SQLite database initialized with `npm run setup`.
- Port 3000 available for the fixed WebUI URL.

SQLite runs in the Node.js process. It does not need Docker or a separate database server.

### B. Required for real code execution

- Docker Engine plus the `docker compose` command, or Docker Desktop.
- The pinned Piston container.
- Python 3.12.0 installed in Piston.
- Port 2000 available on the local loopback interface.
- `PISTON_URL`, which defaults to `http://127.0.0.1:2000`.
- An x86_64/amd64 Docker host is the verified v0.1 platform. ARM64/Apple Silicon can only attempt Docker's amd64 emulation and is not a verified release path.
- Plan for roughly 2 GB of available memory and 1.5 GB of disk for the Piston image/runtime. Actual use varies by platform.

### C. Optional integration

- An OpenAI-compatible Chat Completions provider.
- `LLM_BASE_URL`, `LLM_API_KEY`, and `LLM_MODEL`, configured together.

LeetCode account integration is not present in public v0.1.

### D. Automatically provisioned

- `.env.local`, copied from `.env.example` only when missing.
- `data/` and the default SQLite database.
- The public baseline schema, seed data, WAL mode, and FTS5 index.
- The Piston image and container when you run `npm run piston:up`.
- `piston/data/packages/` as a host-persisted runtime store when Piston installs packages.

The Python runtime itself is confirmation-gated and is not automatically provisioned.

### E. User-provided secret

- `LLM_API_KEY`, only if you choose an external Coach.

`LLM_BASE_URL` and `LLM_MODEL` are configuration values, not usually secrets, but they should still remain in `.env.local`. There are no supported LeetCode Session or CSRF variables.

### F. Development-only

Linting, type checking, Playwright, Vitest, release audits, and Prisma development tools are not part of the ordinary user path.

</details>

<details>
<summary>Automation and environment reference</summary>

### What the helper commands really do

- **`npm run setup` exists and is the ordinary initializer.** It is safe to rerun against a healthy database on the same public v0.1 schema. It preserves learner rows, but refreshes project-owned public problem rows and visible tests. It is not a repair tool for a partial schema and not an upgrade system for future schemas.
- **`npm run db:init` exists and is called by setup.** It generates the Prisma client, applies the baseline only when no `User` table exists, enables WAL, seeds public rows, and rebuilds FTS5. Ordinary users should call `npm run setup` instead.
- **`npm run db:migrate` exists but is a raw one-time baseline SQL execution.** It is not safely repeatable on an initialized database. Do not put it in a normal restart or update routine.
- **The seed is repeatable for project-owned public data.** It upserts the local user and 150 problems, then replaces only system-owned `public_visible` tests. It does not deliberately erase learner-created tests or learning history.
- **`npm run setup:piston` is a non-installing check.** It checks reachability and the exact Python runtime. It does not run user code and does not download a package.
- **`npm run piston:smoke` is the real execution check.** It requires Python 3.12.0 and expects a small program to print `42`.
- **`npm run piston:install` is confirmation-gated.** The public cross-platform form is `npm run piston:install -- --confirm`; it checks whether the package is already installed and then uses Piston's package API.
- **`npm run doctor` is read-mostly and suitable for users.** It opens SQLite read-only and queries Piston, but it checks every component and therefore exits nonzero when intentionally running without Piston.
- **`npm run coach:smoke` makes real external requests.** It verifies an OpenAI-compatible function-tool round trip; it may create provider logs or charges, so use it only after choosing external Coach mode.
- **No app health endpoint, clean-reset script, or update script exists.** Use the scoped manual procedures later in this guide.

### Environment values used by public v0.1

The safe template is `.env.example`; `npm run setup` copies it to the ignored `.env.local` file only when `.env.local` is absent.

- `DATABASE_URL=file:./data/patterncoach.db` — local SQLite file.
- `PISTON_URL=http://127.0.0.1:2000` — server-side Piston API.
- `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` — optional external Coach; all blank or all configured.
- `CODE_RUN_TIMEOUT_MS=3000` — local execution timeout.
- `CODE_RUN_MEMORY_BYTES=134217728` — local execution memory limit.

Ordinary users should keep the safety limits at their defaults. The WebUI also refuses a `PORT` value other than `3000` when started through `npm run dev`.

</details>

## 4. Bootstrap the WebUI and SQLite

Run every command in the project root—the folder containing `package.json`.

> **Windows path:** WSL 2 is the verified/recommended public v0.1 environment. The setup scripts explicitly use `npm.cmd` on native Windows, but the full native PowerShell path has not completed the v0.1 release E2E matrix. Use WSL 2 with Docker Desktop integration when you want the verified path.

### Step 1: Check Node.js and npm

**Why**

PatternCoach is a Next.js application, and its locked Prisma packages require a newer Node.js patch release than a generic “Node 20” label suggests.

**Do — YOU DO THIS**

```bash
node --version
npm --version
```

Use one of these Node.js ranges:

- Node 20.19 or later within Node 20;
- Node 22.12 or later within Node 22; or
- Node 24 or later.

If Node.js is missing, use the official [Node.js download page](https://nodejs.org/en/download). Reopen your terminal after installation.

**Verify**

- [ ] `node --version` prints a compatible version.
- [ ] `npm --version` prints a version instead of `command not found`.

**If it fails**

Go to [Command not found](./troubleshooting.md#command-not-found) or [Nodejs-version-is-not-supported](./troubleshooting.md#nodejs-version-is-not-supported).

### Step 2: Install the locked dependencies

**Why**

The app, SQLite adapter, and setup scripts live in the npm dependency set.

**Do — AUTOMATED**

```bash
npm ci
```

`npm ci` uses `package-lock.json`. It may download packages and run required install scripts, including native SQLite package setup. It does not start PatternCoach, Docker, or a database server.

**Verify**

- [ ] The command exits without an npm error.
- [ ] A `node_modules` directory now exists.
- [ ] `package-lock.json` remains the dependency source of truth.

**If it fails**

Check that you are in the project root, then see [npm ci fails](./troubleshooting.md#npm-ci-fails).

### Step 3: Initialize local configuration and SQLite

**Why**

PatternCoach stores the learner profile, drafts, chat, visible run evidence, history, notes, and planner state in a local SQLite file.

**Do — AUTOMATED**

```bash
npm run setup
```

On a new checkout, the command should report that it created `.env.local`, initialized 150 public Hot-150 contracts, rebuilt the FTS5 index, and initialized the local database.

The default database location is:

```text
data/patterncoach.db
```

The setup script does not overwrite an existing `.env.local`. Re-running it against the same public v0.1 schema preserves learner records, while refreshing project-owned public problem rows and visible tests.

**Verify**

- [ ] The final output includes `PatternCoach AI local setup is ready.`
- [ ] The output reports `150` public Hot-150 contracts.
- [ ] The output reports the local database path.
- [ ] No Docker command was required.

**If it fails**

See [Database initialization failed](./troubleshooting.md#database-initialization-failed). Do not delete an existing database until you have made a backup.

### Step 4: Start the WebUI

**Why**

The Next.js process serves both the browser interface and the local API routes. There is no separate backend process to start.

**Do — AUTOMATED**

```bash
npm run dev
```

Leave this terminal open while you use PatternCoach.

**Verify**

- [ ] The terminal prints `PatternCoach WebUI: open http://localhost:3000`.
- [ ] <http://localhost:3000> opens in your browser.
- [ ] The first visit shows onboarding, or opens the Today page if a profile already exists.
- [ ] Saving or skipping onboarding still has an effect after a browser refresh.
- [ ] The Workbench labels the Coach as the built-in local Coach.
- [ ] Before Piston is ready, `Run Code` is disabled with a clear setup message.

The WebUI port is fixed at 3000. Do not start another copy on 3001 or another alternate port.

> **Network note:** the public v0.1 commands bind the WebUI to localhost and reject an external hostname. Keep your operating-system firewall enabled and do not create a router forwarding rule or public tunnel for port 3000.

**If it fails**

See [Port 3000 is already in use](./troubleshooting.md#port-3000-is-already-in-use) or [The page opens but an action fails](./troubleshooting.md#the-page-opens-but-an-action-fails).

You now have the WebUI and local database bootstrap. Continue through the Piston section for the complete Run/Review product workflow.

## 5. Enable Real Code Execution

PatternCoach uses [Piston](https://github.com/engineer-man/piston) to run Python in a local Docker container. The PatternCoach web app and SQLite database remain on your host computer; only the code runner is containerized.

### Step 1: Check Docker and Compose

**Why**

Piston is distributed as a container. The project uses the modern `docker compose` command.

**Do — YOU DO THIS**

Install Docker from the official [Get Docker](https://docs.docker.com/get-started/get-docker/) page if needed. On Windows, use Docker Desktop with Linux containers and WSL 2 integration; Docker documents the current steps in its [WSL guide](https://docs.docker.com/desktop/features/wsl/).

Start Docker Desktop or your Docker daemon, then run:

```bash
docker --version
docker compose version
docker info
```

**Verify**

- [ ] Both version commands print versions.
- [ ] `docker info` reaches a running Docker daemon.
- [ ] Docker is using Linux containers.

**If it fails**

See [Docker Desktop or the Docker daemon is not running](./troubleshooting.md#docker-desktop-or-the-docker-daemon-is-not-running), [Docker Compose is unavailable](./troubleshooting.md#docker-compose-is-unavailable), or [Windows and WSL-2 issues](./troubleshooting.md#windows-and-wsl-2-issues).

### Step 2: Start Piston

**Why**

This starts the local API that receives code from PatternCoach and executes it inside Piston.

**Do — AUTOMATED**

```bash
npm run piston:up
```

The first start may need to download the pinned container image. Download time depends on your network and Docker cache, so wait for Docker to report the container state instead of relying on a time estimate.

Check the state:

```bash
docker compose -f piston/docker-compose.yml ps
```

**Verify**

- [ ] The service named `api` starts.
- [ ] The published address is `127.0.0.1:2000`, not `0.0.0.0:2000`.

The Compose health check requires both the Piston API and exact Python 3.12.0. With a fresh empty runtime store, `starting` or `unhealthy` is expected until you complete the confirmation-gated runtime installation. The Workbench, doctor, runner, and Compose health check all require the exact public runtime.

**If it fails**

See [Piston is unhealthy or unreachable](./troubleshooting.md#piston-is-unhealthy-or-unreachable) or [Port 2000 is already in use](./troubleshooting.md#port-2000-is-already-in-use).

### Step 3: Run a real Python smoke test

**Why**

A Piston API can start while its runtime store is empty. The smoke test checks the exact Python version and executes a small real program.

**Do — VERIFY**

```bash
npm run piston:smoke
```

**Verify**

Success is exactly the kind of result you want to see:

```text
PASS: real local Python execution (3.12.0).
```

If this passes, do not run the runtime installer.

**If it fails**

- If Piston is unreachable, go to [Piston is unhealthy or unreachable](./troubleshooting.md#piston-is-unhealthy-or-unreachable).
- If it specifically says Python 3.12.0 is not installed, continue to Step 4.
- For any other error, read it before changing Docker state. Do not delete Docker data as a first repair step.

### Step 4: Install Python only when the smoke test proves it is missing

**Why**

The runtime download is intentionally separate. A fresh `piston/data/packages/` store should be treated as missing Python until the smoke test proves otherwise.

**Do — YOU DO THIS**

Review and approve the download. The same explicit command works through npm on macOS, Linux, WSL, and PowerShell:

```bash
npm run piston:install -- --confirm
```

The confirmation value is not a secret. It exists to prevent an installer or assistant from silently downloading Piston packages.

After installation, run the real smoke again:

```bash
npm run piston:smoke
```

**Verify**

- [ ] The installer reports Python 3.12.0 installed or already installed.
- [ ] The second smoke prints `PASS: real local Python execution (3.12.0).`
- [ ] `piston/data/packages/` now persists the runtime on the host across container restarts.

**If it fails**

See [Python runtime is missing](./troubleshooting.md#python-runtime-is-missing) or [Piston downloads are slow or interrupted](./troubleshooting.md#piston-downloads-are-slow-or-interrupted).

### Step 5: Run the full doctor

**Why**

At this point all checks—including Piston—should pass.

**Do — VERIFY**

```bash
npm run doctor
```

**Verify**

Look for:

```text
PASS  Node.js: ...
PASS  Hot-150 bank: 150/150 contracts
PASS  SQLite: 150/150 problems; FTS5 ready
PASS  Coach provider: built-in local Coach
PASS  Piston: reachable; Python 3.12.0 ready
```

If you configured an external Coach, the Coach line says it is configured and asks you to run the separate Coach smoke.

> Without Piston, `npm run doctor` reports `CHECK Piston` and exits nonzero. The UI may still open for setup diagnostics, but the normal Run/Review workflow is not ready.

**If it fails**

Use the first `CHECK` line to choose a section in [Troubleshooting](./troubleshooting.md).

### Step 6: Verify from the Workbench

**Do — VERIFY**

If the WebUI is already open, refresh it after Piston becomes ready. Open a problem, keep a visible test selected, and run Python code with `Run Code`.

**Verify**

- [ ] The Workbench says `Local Piston is healthy. Run and Review execute real Python code.`
- [ ] `Run Code` is enabled.
- [ ] The result is labeled real local execution evidence.
- [ ] `Review My Code` performs its own real execution and responds only when that execution returns trusted evidence.
- [ ] The UI refers to visible tests, not hidden-test acceptance.

### Piston security and persistence

The compose file currently uses:

- image `ghcr.io/engineer-man/piston` pinned by digest `sha256:2f66b7456189c4d713aa986d98eccd0b6ee16d26c7ec5f21b30e942756fd127a`;
- host binding `127.0.0.1:2000:2000`;
- a bind-mounted runtime store at `piston/data/packages/`;
- a privileged container, as required by this Piston deployment;
- `restart: unless-stopped`;
- `platform: linux/amd64` (verified on x86_64; ARM64 emulation is unverified);
- an executable temporary filesystem for code execution.

Keep port 2000 loopback-only. Stop Piston when you are not using code execution:

```bash
npm run piston:down
```

If your organization blocks privileged containers, do not weaken system security policy to force this setup. You may inspect the UI, but the complete Run/Review workflow will be unavailable.

## 6. Configure the Coach

### Built-in local Coach — no key required

**Why**

The built-in Coach lets you explore without creating an external account or sending coaching context to a model provider.

**Do — OPTIONAL**

Do nothing. The generated `.env.local` leaves all LLM fields blank.

**Verify**

- [ ] The Workbench says it is using the built-in local Coach.
- [ ] Coach Chat returns deterministic, checkable guidance.
- [ ] After Piston is ready, Review returns deterministic feedback grounded in visible-test evidence.

The local Coach is intentionally limited. It is not a locally hosted language model. Its responses follow project-defined deterministic templates.

**If it fails**

If the UI says the configuration is incomplete, one or two LLM fields have values. Clear all three fields or configure all three together, then restart the app.

### External Coach — optional model-powered responses

**Why**

An external provider can generate more flexible Review and Chat guidance while preserving the same visible-test and no-full-solution boundaries.

**Do — YOU DO THIS**

Open `.env.local` in a local text editor. Do not paste the key into a chat, terminal command, screenshot, issue, or shared log.

Set all three fields together, using values from a provider that supports OpenAI-compatible Chat Completions and function tools:

```dotenv
LLM_BASE_URL=https://your-provider.example/v1
LLM_API_KEY=your_api_key_here
LLM_MODEL=your_model_name
```

The code contains no provider-specific preset or validated provider list. Use the exact base URL and model identifier documented by your provider.

Save the file, stop the running WebUI with `Ctrl+C`, and restart it:

```bash
npm run dev
```

Then, in a second terminal in the project root, run:

```bash
npm run coach:smoke
```

**Verify**

- [ ] The smoke prints `PASS: the configured Coach provider completed an OpenAI-compatible tool-call round trip.`
- [ ] The Workbench labels the provider as external.
- [ ] Review or Chat says it used your configured LLM provider.

The ordinary doctor checks only that all three settings are present. `npm run coach:smoke` is the real connectivity check.

`LLM_API_KEY` has no `NEXT_PUBLIC_` prefix and is read by server-side code. The browser receives only the provider status, not the key. The public Coach client uses generic failure messages rather than intentionally logging the credential. Keep `.env.local` private anyway: local tools, screenshots, shell commands, or accidental file sharing can bypass those application boundaries.

**If it fails**

See [LLM configuration is missing or incomplete](./troubleshooting.md#llm-configuration-is-missing-or-incomplete), [LLM authentication fails](./troubleshooting.md#llm-authentication-fails), or [The provider model is not found](./troubleshooting.md#the-provider-model-is-not-found).

### What leaves your computer

When the external Coach is enabled, the app sends coaching context to the configured provider.

For Review, that context can include:

- public problem metadata and signature;
- the current Python code;
- visible-test status, counts, first failed case, and stderr;
- selected Profile fields, focused Memory facts, and recent Review episodes.

For Coach Chat, that context can include:

- the current problem title;
- the current Python draft;
- your current message and recent uncleared turns for the problem;
- selected Profile fields, focused Memory facts, and recent Review episodes;
- results of tools the Coach calls, including real execution evidence, retrieved local learning records, and authorized write outcomes.

Your SQLite database is not uploaded as a file, but selected content from it can appear in those prompts. Use an HTTPS provider endpoint, review its privacy and retention terms, and remember that `npm run coach:smoke` can create provider logs or charges. The smoke uses fixed synthetic text and does not read your database or draft.

### Return to the local Coach

Open `.env.local` locally and leave all three LLM fields blank. Restart the WebUI. Do not leave a partial configuration.

If a key may have been exposed, revoke or rotate it in the provider's account console. Clearing the local file does not revoke a leaked credential.

## 7. Connect LeetCode Features

There is no LeetCode account connection in public v0.1.

- `LEETCODE_SESSION` is not a supported environment variable.
- A CSRF token is not requested or read.
- The app does not submit code to LeetCode.
- The app does not import account history.
- The app does not claim hidden-test acceptance.
- No public code path reads, logs, sends to the browser, or stores a LeetCode Session or CSRF token.

Without any LeetCode credential, you can still:

- browse the local Hot-150 catalog;
- open public problem links;
- write Python drafts;
- create visible custom tests;
- run visible tests locally after enabling Piston;
- use local or external coaching.

Do not send a LeetCode Session or Cookie header to Codex, a support issue, or another person. Do not add one to `.env.local` in anticipation of a future feature.

If account integration is added in a future release, obtaining an authenticated browser cookie would be one of the few steps automation cannot safely do for you. Follow that future release's documentation rather than adapting old private-development instructions.

## 8. Let Codex Set It Up

Codex can handle the plumbing. You remain in control of credentials and account access.

Copy the prompt below into Codex after opening the PatternCoach project folder. Do not add a secret to the prompt.

```text
Help me install PatternCoach AI on this computer.

First read docs/user-setup.md and
docs/troubleshooting.md. Inspect the current operating system,
shell, project root, and existing local state before changing anything.

Ask me which target I want:
1) UI/catalog preview with the built-in local Coach (not a complete install),
2) real local Python execution with Piston, or
3) real execution plus an external OpenAI-compatible Coach.

Handle all non-sensitive plumbing that belongs to my chosen target:
- check the actual Node.js and npm versions against the locked dependencies;
- run npm ci when dependencies are absent or need to match package-lock.json;
- run the project's setup script and verify the SQLite result;
- check Docker and Docker Compose for the complete installation;
- start Piston with the existing project command;
- run the real Piston smoke before considering runtime installation;
- install Python 3.12.0 only if that smoke specifically reports it missing,
  and pause for my explicit approval before the download;
- use the existing doctor and Coach smoke where applicable;
- report the command, exit result, and acceptance evidence after every step;
- explain a failure before taking a repair action.

Credential rules:
- pause when an API key, Session, token, or account action would be needed;
- tell me which local file and placeholder field I must edit myself;
- never ask me to paste a secret into this chat;
- do not read, print, summarize, or echo any secret value;
- do not place a secret in a shell command or command history;
- do not display the contents of .env or .env.local;
- do not commit .env.local or any database.

Safety and scope rules:
- do not modify business logic or files unrelated to installation;
- do not change the fixed WebUI port from 3000;
- do not expose the WebUI or Piston to a public interface or tunnel;
- do not run docker system prune, docker volume prune, or a global cleanup;
- do not delete or reset my database, Piston runtime store, container, or
  dependency cache without explaining the exact scope and getting approval;
- do not run git push;
- preserve existing user data and make a scoped backup before an update or reset;
- if I intentionally request preview-only mode, report that Run/Review are unavailable
  and that the nonzero Piston doctor result means the complete installation is not ready.

At the end, give me a checklist showing WebUI, SQLite, Piston/Python (if chosen),
Coach, and optional integration status. Never claim a service passed unless its
real check ran successfully.
```

## 9. Verify the Whole App

Use the checklist for the setup level you chose.

### UI/catalog preview

- [ ] `npm ci` completed.
- [ ] `npm run setup` reported 150 public contracts and a local database.
- [ ] `npm run dev` opened <http://localhost:3000>.
- [ ] Onboarding saved or skipped and remained after refresh.
- [ ] The Workbench shows the built-in local Coach.
- [ ] Coach Chat responds.
- [ ] `Run Code` is disabled with a clear Piston message.
- [ ] You understand this preview is not the complete PatternCoach Run/Review workflow.

### Real local execution

- [ ] The WebUI and SQLite bootstrap checks pass.
- [ ] `npm run piston:smoke` reports real Python 3.12.0 execution.
- [ ] `npm run doctor` has no `CHECK` lines.
- [ ] Refreshing the Workbench enables `Run Code`.
- [ ] A selected visible test produces real execution evidence.
- [ ] `Review My Code` performs its own real Piston run and persists only executed evidence.

### External Coach

- [ ] All three LLM settings were entered locally.
- [ ] The WebUI was restarted after the change.
- [ ] `npm run coach:smoke` passed.
- [ ] The Workbench labels the Coach as external.
- [ ] You understand which current code, message, evidence, and recent summaries are sent to the provider.

### Integration status

- [ ] LeetCode Session and CSRF are not configured because public v0.1 does not support account integration.
- [ ] No port has been forwarded or exposed publicly.
- [ ] No secret or local database is tracked or shared.

## 10. Start, Stop, Update, Back Up, and Reset

### Start

For UI/catalog preview only:

```bash
npm run dev
```

For real execution, start Piston first and then start the WebUI:

```bash
npm run piston:up
npm run dev
```

Open <http://localhost:3000>.

### Stop

Stop the WebUI with `Ctrl+C` in its terminal.

Stop Piston with:

```bash
npm run piston:down
```

`piston:down` removes this project's Piston container and Compose network. It does not remove the Python runtime files in `piston/data/packages/` and does not touch SQLite.

### Restart after a configuration change

1. Stop the WebUI with `Ctrl+C`.
2. If the change affects Piston, run `npm run piston:down` and `npm run piston:up`.
3. Start the WebUI with `npm run dev`.
4. Refresh the browser.
5. Run the relevant smoke test.

### Update

Public v0.1 has no in-app updater and no general database migration chain for future releases.

Before replacing source files:

1. Stop the WebUI.
2. Stop Piston.
3. Back up the database and `.env.local` without sharing either file.
4. Read the new release's migration notes.
5. Preserve `data/`, `.env.local`, and `piston/data/packages/` unless the release explicitly says otherwise.

After obtaining the updated source through that release's documented method, the normal dependency and setup checks are:

```bash
npm ci
npm run setup
npm run doctor
```

Do not assume `npm run setup` can migrate every older database. In public v0.1 it applies one baseline schema to a new database and skips that baseline when it detects an existing `User` table. If a future release changes the schema, use its release-specific migration instructions.

### Back up the default database

Stop the WebUI before copying SQLite. This keeps the main database and any WAL companion files consistent.

macOS, Linux, or WSL:

```bash
mkdir -p backups
cp -p data/patterncoach.db* backups/
ls -lh backups/patterncoach.db*
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force backups | Out-Null
Copy-Item data/patterncoach.db* backups/
Get-ChildItem backups/patterncoach.db*
```

**Verify**

- [ ] At least `backups/patterncoach.db` exists.
- [ ] The copied file has a non-zero size.
- [ ] The backup remains local and is not attached to a support request.

If you changed `DATABASE_URL`, these commands do not apply. Locate the configured file in your local editor without printing `.env.local`, then make a scoped copy of that file and its `-wal`/`-shm` companions while the app is stopped.

### Reset only the default PatternCoach database

This permanently deletes the learner profile, drafts, runs, chat, history, notes, planner state, and other PatternCoach data in the default database. It does not affect Piston.

1. Stop the WebUI.
2. Make a backup.
3. Confirm that you are in the PatternCoach project root and that `DATABASE_URL` still uses the default `data/patterncoach.db` path.

macOS, Linux, or WSL:

```bash
test -f package.json && test -f prisma/schema.prisma
rm -f -- data/patterncoach.db data/patterncoach.db-wal data/patterncoach.db-shm
npm run setup
```

Windows PowerShell:

```powershell
if (-not (Test-Path package.json) -or -not (Test-Path prisma/schema.prisma)) { throw "Not in the PatternCoach project root" }
Remove-Item -Force -ErrorAction SilentlyContinue data/patterncoach.db, data/patterncoach.db-wal, data/patterncoach.db-shm
npm run setup
```

**Verify**

- [ ] Setup reports a new local database and 150 contracts.
- [ ] The next browser visit returns to onboarding.
- [ ] Your backup still exists.

Do not use these commands with a custom `DATABASE_URL`.

### Remove only this project's Piston container

```bash
npm run piston:down
```

There is no named Docker volume in the provided compose file. Python packages live in the project folder at `piston/data/packages/`, so global Docker volume cleanup is unnecessary and unsafe.

<details>
<summary>Clear only the PatternCoach Piston runtime store</summary>

### Clear only the PatternCoach Piston runtime store

This forces a future Python runtime download. It does not reset the PatternCoach database.

First stop Piston. Then verify the project root and remove only the exact runtime directory.

macOS, Linux, or WSL:

```bash
npm run piston:down
test -f piston/docker-compose.yml && rm -rf -- piston/data/packages
```

Windows PowerShell:

```powershell
npm run piston:down
if (-not (Test-Path piston/docker-compose.yml)) { throw "Not in the PatternCoach project root" }
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue piston/data/packages
```

To restore execution later:

```bash
npm run piston:up
npm run piston:smoke
```

The first smoke should report the missing Python runtime. Review the download, run the confirmation-gated installer, and then repeat the smoke.

</details>

Never use `docker system prune` or `docker volume prune` as a PatternCoach repair step. Those commands can remove unrelated projects' data.

## 11. Need Help?

Start with [PatternCoach Troubleshooting](./troubleshooting.md).

When reporting a problem, it is useful to provide:

- your operating system and whether Windows uses WSL 2;
- `node --version`, `npm --version`, `docker --version`, and `docker compose version` as applicable;
- the name of the command that failed;
- a short, redacted error message;
- redacted `npm run doctor` output;
- `docker compose -f piston/docker-compose.yml ps` output;
- the final PASS/FAIL line from `npm run piston:smoke` or `npm run coach:smoke`.

Do **not** provide:

- `.env.local` or its contents;
- an LLM API key, authorization header, Session, CSRF token, or Cookie header;
- the SQLite database or backup;
- screenshots containing full credentials;
- private code, chat, or learner data unless you deliberately redact it;
- the contents of `piston/data/packages/`.

If a credential was exposed, revoke or rotate it with the account provider before continuing troubleshooting.
