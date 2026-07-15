# PatternCoach AI Troubleshooting

> Public v0.1. Start with the symptom you can observe. You do not need to understand the whole stack before fixing one layer.

## Before You Share an Error

Keep diagnostics local until you have reviewed them.

Safe details usually include:

- operating system and shell;
- Node.js, npm, Docker, and Compose versions;
- the command name and exit code;
- a short redacted error message;
- the PASS/CHECK lines from `npm run doctor`;
- container state from `docker compose -f piston/docker-compose.yml ps`;
- the final line from a smoke test.

Do not share:

- `.env`, `.env.local`, or their contents;
- API keys, authorization headers, cookies, Session values, or CSRF tokens;
- the SQLite database or a backup;
- private code, chat, or learner content without redaction;
- the contents of `piston/data/packages/`.

Do not run a command that prints all environment variables. Do not put a key in a command argument to test it. If a credential appears in a terminal, screenshot, issue, or chat, revoke or rotate it before doing anything else.

## How to Read `npm run doctor`

The doctor checks all major components:

- Node.js;
- 150 local problem contracts;
- SQLite and FTS5;
- Coach configuration completeness;
- Piston and Python 3.12.0.

It prints `PASS` for a successful check and `CHECK` for one needing attention. It exits with a failure status if any component has `CHECK`.

Without Piston, this is expected:

```text
CHECK  Piston: not reachable; required for Run Code
```

The WebUI can still open for setup diagnostics and catalog browsing, but the complete PatternCoach Run/Review workflow is not available. Normal use requires Docker and Piston.

There is no separate application `/api/health` endpoint in public v0.1. The doctor checks configuration and runtime availability; it does not execute user code or contact an external Coach. `piston:smoke`, `coach:smoke`, and direct UI checks are the real service verification layers.

## Installation and Command Problems

### Command not found

**Symptom**

The terminal reports that `node`, `npm`, `docker`, or another command is not recognized or not found.

**Likely cause**

- The required program is not installed.
- It was installed after this terminal was opened.
- Its executable directory is not on your shell's `PATH`.
- On Windows, you are running inside a WSL distribution that does not have access to the same tools as PowerShell, or the reverse.

**Check**

Run only the checks for the setup level you chose:

```bash
node --version
npm --version
docker --version
docker compose version
```

Docker is required for the normal Run/Review workflow. Without it, only setup diagnostics and catalog/UI preview are available.

**Fix**

1. Install Node.js from the official [Node.js download page](https://nodejs.org/en/download).
2. If you want real code execution, install Docker from [Get Docker](https://docs.docker.com/get-started/get-docker/).
3. Close and reopen the terminal after installation.
4. Run the version commands again in the same shell where you will run PatternCoach.

Do not download an executable from an unofficial mirror to work around a missing command.

**Success looks like**

- `node --version` and `npm --version` print versions.
- If execution mode is selected, `docker --version` and `docker compose version` also print versions.

### Node.js version is not supported

**Symptom**

- `npm ci` reports an `EBADENGINE` warning or fails.
- Prisma or Next.js refuses to start.
- A native SQLite dependency fails to load.
- `npm run doctor` prints `CHECK Node.js` for a version outside the supported ranges.

**Likely cause**

The public v0.1 doctor and package metadata both require Node `^20.19.0`, `^22.12.0`, or `>=24.0.0`.

**Check**

```bash
node --version
```

Supported ranges from the locked dependencies are:

- Node 20.19+ within Node 20;
- Node 22.12+ within Node 22;
- Node 24+.

**Fix**

Install a compatible Node.js release, reopen the terminal, and reinstall the locked dependencies:

```bash
npm ci
```

Use your normal trusted Node.js installer or version manager. Do not bypass package engine checks as the repair; the application can fail later even if installation is forced.

**Success looks like**

- `node --version` is in a supported range.
- `npm ci` exits without an engine error.
- `npm run setup` can load Prisma and `better-sqlite3`.

### `npm ci` fails

**Symptom**

Dependency installation stops with a lockfile, network, permissions, or native-module error.

**Likely cause**

- The terminal is not in the project root.
- `package-lock.json` is missing or does not match `package.json`.
- Node.js is outside the supported range.
- The npm registry or network is temporarily unavailable.
- A native `better-sqlite3` package cannot use its prebuilt binary on this platform and lacks local build prerequisites.
- The source folder is on a read-only or restricted filesystem.

**Check**

macOS, Linux, or WSL:

```bash
pwd
test -f package.json && test -f package-lock.json && echo "project files found"
node --version
npm --version
```

Windows PowerShell:

```powershell
Get-Location
Test-Path package.json
Test-Path package-lock.json
node --version
npm --version
```

Read the first npm error, not only the final summary. Redact local usernames and paths before sharing it.

**Fix**

1. Change to the folder containing both package files.
2. Correct the Node.js version first if necessary.
3. Retry `npm ci` after a transient network failure.
4. If the error names a native build tool, install the platform's trusted compiler prerequisites rather than disabling npm install scripts.
5. If the lockfile is missing or inconsistent in an official release archive, obtain a clean release copy. Do not regenerate the lockfile as an ordinary installation step.

**Success looks like**

- `npm ci` exits with status 0.
- `node_modules` exists.
- `npm run setup` starts without a module-not-found error.

### The terminal is in the wrong folder

**Symptom**

- npm reports `ENOENT` for `package.json`.
- a `piston/docker-compose.yml` path cannot be found;
- setup creates files somewhere unexpected;
- reset safety checks stop with `Not in the PatternCoach project root`.

**Likely cause**

The command was run from a parent folder, another checkout, or a subdirectory.

**Check**

macOS, Linux, or WSL:

```bash
pwd
test -f package.json && test -f prisma/schema.prisma && test -f piston/docker-compose.yml
```

Windows PowerShell:

```powershell
Get-Location
Test-Path package.json
Test-Path prisma/schema.prisma
Test-Path piston/docker-compose.yml
```

**Fix**

Open a terminal in the PatternCoach source folder—the folder containing `package.json`—and repeat the original non-destructive check.

**Success looks like**

- All three project files exist relative to the current directory.
- `npm run setup` reports a database path inside the intended project by default.

## Docker and Piston Problems

### Docker Desktop or the Docker daemon is not running

**Symptom**

- `Cannot connect to the Docker daemon`;
- `error during connect`;
- `npm run piston:up` cannot create the service;
- Docker commands hang or report that the engine is stopped.

**Likely cause**

The Docker CLI is installed, but its daemon or Docker Desktop application is not running.

**Check**

```bash
docker info
```

**Fix**

- macOS or Windows: start Docker Desktop and wait until it reports that the engine is running.
- Linux: start the Docker service using your distribution's documented service manager.
- Windows with WSL 2: ensure Docker Desktop WSL integration is enabled for the distribution containing the project.

Do not disable a firewall, endpoint-security tool, or organization policy without understanding and approving that security change.

**Success looks like**

- `docker info` returns server information.
- `npm run piston:up` can create or start the Piston service.

### Docker Compose is unavailable

**Symptom**

`docker` works, but `docker compose` reports that `compose` is not a command.

**Likely cause**

- The Compose plugin is not installed.
- An older Docker installation provides only the legacy `docker-compose` binary.
- Docker Desktop installation is incomplete.

**Check**

```bash
docker --version
docker compose version
```

**Fix**

Install or update Docker Desktop, or install the official Docker Compose plugin for your Docker Engine. PatternCoach package scripts call `docker compose`; renaming the command in your head does not change what the scripts execute.

Do not edit project scripts as the first installation repair.

**Success looks like**

```text
Docker Compose version ...
```

and `npm run piston:up` reaches the compose file.

### Windows and WSL 2 issues

**Symptom**

- Docker works in PowerShell but not in WSL, or the reverse.
- The Piston container cannot start in Windows container mode.
- Bind-mounted runtime files behave unexpectedly.
- Docker reports WSL integration or Linux-kernel errors.

**Likely cause**

- The distribution is WSL 1 instead of WSL 2.
- Docker Desktop integration is disabled for that distribution.
- Docker Desktop is using Windows containers.
- Commands are being split across PowerShell and WSL environments with different project paths or Node installations.
- Native PowerShell has not completed the full v0.1 release E2E matrix, although the setup scripts explicitly select `npm.cmd` on Windows.

The provided Compose file pins `linux/amd64`. The verified v0.1 runner platform is x86_64/amd64; Apple Silicon and other ARM64 hosts depend on Docker's amd64 emulation and are not a verified performance or compatibility path.

**Check**

From PowerShell:

```powershell
wsl.exe -l -v
docker info
docker compose version
```

From the WSL terminal where the project lives:

```bash
docker info
docker compose version
node --version
npm --version
```

**Fix**

1. Use WSL 2, not WSL 1.
2. In Docker Desktop, enable **Settings → Resources → WSL Integration** for the chosen distribution.
3. Use Linux containers.
4. Run PatternCoach commands consistently from one environment.
5. Prefer keeping the source in the WSL Linux filesystem when running the project from WSL; this also gives Docker more predictable bind-mount behavior.
6. Prefer WSL 2 for the verified release path. If using native PowerShell, keep all commands in that environment and report any platform-specific failure without weakening the setup scripts.

Follow Docker's current [WSL 2 backend guide](https://docs.docker.com/desktop/features/wsl/). Do not install a second conflicting Docker Engine inside WSL as an unplanned workaround.

**Success looks like**

- The same WSL terminal can run Node/npm and reach the Docker daemon.
- `npm run setup` completes its nested database commands.
- `npm run piston:up` starts a Linux Piston container.
- `npm run piston:smoke` reaches the Piston API.

### Port 3000 is already in use

**Symptom**

`npm run dev` refuses to start and says port 3000 is already in use.

**Likely cause**

Another PatternCoach instance or another local web application is listening on the fixed WebUI port.

**Check**

First open <http://localhost:3000>. It may be the PatternCoach instance you intended to use.

To identify the listener:

macOS or Linux, if `lsof` is available:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Windows PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

**Fix**

- If the existing page is the correct PatternCoach instance, use it.
- Otherwise, stop the owning application through the terminal, service manager, or application that started it.
- Confirm what the process is before stopping it.

Do not start PatternCoach on 3001 or another port. The WebUI and request guard are deliberately pinned to <http://localhost:3000>.

**Success looks like**

- Port 3000 is free before launch.
- `npm run dev` prints the canonical localhost URL.

### Port 2000 is already in use

**Symptom**

`npm run piston:up` reports that it cannot bind `127.0.0.1:2000`, or the Piston check reaches an unexpected service.

**Likely cause**

- Another Piston instance is running.
- Another application owns local port 2000.
- A second PatternCoach checkout is using the fixed container name or port.

**Check**

```bash
docker compose -f piston/docker-compose.yml ps
docker ps --format "table {{.Names}}\t{{.Ports}}"
npm run setup:piston
```

The setup check should identify whether the service at `PISTON_URL` is reachable and has the exact Python 3.12.0 runtime.

**Fix**

1. If the intended PatternCoach Piston container is already running and the smoke passes, use it.
2. If another known project owns the port, stop that project through its own command before starting PatternCoach.
3. Do not stop or remove an unknown container without identifying it.

The provided compose and default environment use fixed port 2000. There is no supported alternate-port setup command in public v0.1.

**Success looks like**

- `npm run piston:up` starts without a bind error.
- `npm run piston:smoke` passes against the intended local service.

### Piston is unhealthy or unreachable

**Symptom**

- `Run Code` is disabled.
- The Workbench says to start local Piston.
- `npm run setup:piston` says Piston is not reachable.
- `npm run piston:smoke` fails before checking Python.
- The doctor prints `CHECK Piston`.

**Likely cause**

- Docker is not running.
- The Piston container has not started or is restarting.
- Port 2000 is occupied.
- `PISTON_URL` points somewhere else.
- Docker or organization policy refuses the privileged container.

**Check**

```bash
docker info
npm run piston:up
docker compose -f piston/docker-compose.yml ps
npm run setup:piston
```

If the container is running but unhealthy, inspect its local logs:

```bash
npm run piston:logs
```

Press `Ctrl+C` to stop following logs; this does not stop the container.

**Fix**

1. Resolve Docker-daemon or port errors first.
2. Leave the published Piston address bound to `127.0.0.1`.
3. If you changed `PISTON_URL`, check it in a local editor without printing `.env.local`. Restore `http://127.0.0.1:2000` for the provided compose service.
4. Restart only this project service:

   ```bash
   npm run piston:down
   npm run piston:up
   ```

5. If logs show that privileged containers are forbidden, ask your system administrator about an approved local execution environment. You may preview the UI, but the complete product workflow is unavailable; do not disable host security controls.

**Success looks like**

- After Python is installed, Compose reports the `api` service as healthy.
- `npm run setup:piston` says Piston is reachable and either confirms Python or names the exact missing runtime.
- `npm run piston:smoke` proceeds to the runtime check.

### Python runtime is missing

**Symptom**

- Piston is reachable, but `npm run piston:smoke` says Python 3.12.0 is not installed.
- `npm run setup:piston` exits after naming the missing runtime.
- The doctor reports `reachable; Python 3.12.0 missing`.

**Likely cause**

Piston's host-persisted package directory is new, empty, incomplete, or was cleared. The API process can start without a runtime, but the provided Compose health check remains unhealthy until exact Python 3.12.0 is present.

**Check**

```bash
npm run piston:smoke
```

Only continue to installation if this real smoke specifically reports the missing Python 3.12.0 runtime.

**Fix**

Approve the runtime download, then use the cross-platform confirmation flag:

```bash
npm run piston:install -- --confirm
npm run piston:smoke
```

Do not infer that installation is needed because `/api/v2/packages` lists Python as available. The smoke and the package's `installed` state are the relevant evidence.

**Success looks like**

```text
PASS: real local Python execution (3.12.0).
```

### Piston downloads are slow or interrupted

**Symptom**

- `npm run piston:up` spends time pulling the image.
- The confirmation-gated runtime installer takes longer than expected.
- A network interruption leaves Python unavailable.

**Likely cause**

The container image and Python package are separate downloads. Duration varies with network, registry availability, disk performance, and cache state.

**Check**

```bash
docker compose -f piston/docker-compose.yml ps
npm run setup:piston
```

If setup says Python is ready, run the smoke. If it says Python is missing after an interrupted install, the installation did not complete.

**Fix**

1. Keep Docker running and confirm that the computer has free disk space and network access to the configured registry/package source.
2. Do not repeatedly remove `piston/data/packages/`; that discards completed downloads.
3. After an interruption, rerun the smoke.
4. If the smoke still specifically reports Python missing, approve and rerun the confirmation-gated installer.

Do not use a global Docker prune as a download repair.

**Success looks like**

- Piston becomes healthy after exact Python 3.12.0 is installed.
- Python installation completes.
- The real smoke prints PASS.

### Piston is healthy but `Run Code` stays disabled

**Symptom**

The command-line smoke passes, but the open Workbench still shows Piston as unavailable.

**Likely cause**

The Workbench reads Piston health while the page is rendered. The browser still has the state from before Piston became ready.

**Check**

```bash
npm run piston:smoke
```

**Fix**

Refresh the Workbench after the smoke passes. If it remains disabled, verify that the WebUI and smoke load the same `PISTON_URL`, then restart the WebUI.

**Success looks like**

- The Workbench says `Local Piston is healthy. Run and Review execute real Python code.`
- `Run Code` and `Review My Code` are enabled.

### `Run Code` is enabled but the runtime request fails

**Symptom**

The Workbench says Piston is ready, but the execution request fails or the service becomes unavailable.

**Likely cause**

The page, doctor, runner, and Compose health check all require exact Python 3.12.0. A request can still fail if Piston stops after the page renders, `PISTON_URL` changes, the runtime store is removed, or Docker rejects the execution.

**Check**

```bash
npm run setup:piston
npm run piston:smoke
```

**Fix**

If the real smoke specifically reports Python 3.12.0 missing, follow [Python runtime is missing](#python-runtime-is-missing). If it reports another error, repair that service/runtime error and refresh the page.

**Success looks like**

- The real smoke prints PASS for Python 3.12.0.
- A refreshed Workbench run returns executed evidence.

## SQLite and Local Data Problems

### Database initialization failed

**Symptom**

- `npm run setup` exits before `PatternCoach AI local setup is ready.`
- The doctor says SQLite is not initialized or cannot read the public schema.
- Onboarding cannot save.
- The terminal reports a Prisma, SQLite, file-permission, or FTS5 error.

**Likely cause**

- Dependencies or the Prisma client were not installed/generated.
- The current directory is wrong.
- The project folder is read-only.
- `DATABASE_URL` is malformed or points to a location you cannot write.
- A partially initialized database already exists.
- Another process is holding the database.

Docker is not a database dependency; starting Docker will not repair SQLite.

**Check**

```bash
node --version
npm --version
npm run setup
```

Read the first setup error. Check `DATABASE_URL` in your local editor without printing the file. A SQLite URL must use a local file path; the default is `file:./data/patterncoach.db`.

**Fix**

1. Finish `npm ci` successfully.
2. Confirm the terminal is in the project root.
3. Close other PatternCoach instances and SQLite browser tools.
4. Correct a malformed custom `DATABASE_URL` locally, or restore the default.
5. Run `npm run setup` again.
6. If a brand-new database is partially initialized and contains no data you need, follow the scoped reset in the [Setup Guide](./user-setup.md#reset-only-the-default-patterncoach-database).

Do not reset an existing database with learner data before backing it up.

**Success looks like**

- Setup reports the database path and 150 public contracts.
- `npm run doctor` reports `SQLite: 150/150 problems; FTS5 ready`.

### SQLite is locked

**Symptom**

The app or setup reports `database is locked`, `SQLITE_BUSY`, or cannot update a row.

**Likely cause**

- More than one PatternCoach process is writing to the same file.
- Prisma Studio, a SQLite browser, backup tool, or another process holds a transaction.
- Setup is running while the WebUI is active.
- A previous process did not shut down cleanly.

PatternCoach enables WAL mode to improve normal concurrency, but WAL does not make every maintenance operation safe while writers are active.

**Check**

- Look for another terminal running `npm run dev`.
- Close any SQLite inspection application.
- Confirm that no backup or sync tool is actively copying the database.

Do not delete `patterncoach.db-wal` or `patterncoach.db-shm` while any process has the database open.

**Fix**

1. Stop the WebUI with `Ctrl+C`.
2. Close database inspection tools.
3. Wait for those processes to exit normally.
4. Retry the original setup or app operation.
5. If the lock recurs, make a stopped-state backup and report the redacted error before resetting.

**Success looks like**

- `npm run setup` completes.
- Onboarding or another write persists after refresh.
- No `SQLITE_BUSY` error appears in the WebUI terminal.

### Migration failed

**Symptom**

- `npm run db:migrate` reports that a table or index already exists.
- `npm run setup` fails while applying `0001_public_baseline`.
- A database from another revision has missing columns or tables.

**Likely cause**

Public v0.1 contains one raw baseline SQL file, not an incremental migration history. The initializer applies it only when it cannot find the `User` table. A partially created database can therefore collide with a second baseline attempt, while an older database containing `User` can skip schema work it still needs.

**Check**

Determine whether the database is:

- a new disposable database;
- an existing database with learner data; or
- a database copied from another project/release.

Do not inspect it by posting the file to an online service.

**Fix**

- **New and disposable:** use the exact default-database reset in the [Setup Guide](./user-setup.md#reset-only-the-default-patterncoach-database), then run `npm run setup` once.
- **Contains learner data:** stop, back it up, and keep the original unchanged. Look for release-specific migration instructions or report the schema error. Do not repeatedly apply the baseline.
- **Copied from another release/project:** use a separate database path or the migration path for its source release.

**Success looks like**

- Setup completes on a coherent public v0.1 schema.
- The doctor finds 150 problem rows and the FTS5 table.
- Existing data was either preserved through an explicit migration or protected in a backup.

### FTS5 is missing

**Symptom**

The doctor reports `FTS5 missing`, or local memory search fails after the relational database otherwise opens.

**Likely cause**

The setup command did not reach the FTS rebuild step, or the local SQLite build lacks FTS5 support.

**Check**

```bash
npm run setup
npm run doctor
```

**Fix**

If the relational schema is healthy, rebuild the project-owned index:

```bash
npm run fts:rebuild
```

This reads existing episodes, facts, and notes and rebuilds their lexical index. It is not a database reset.

If SQLite itself reports that module `fts5` is unavailable, confirm that `npm ci` completed with the locked `better-sqlite3` package on a supported Node/platform combination.

**Success looks like**

```text
PASS  SQLite: 150/150 problems; FTS5 ready
```

### The profile or local data does not persist

**Symptom**

- Onboarding returns after every refresh.
- a draft, chat, or planner change disappears;
- the app appears to use a new database after restart.

**Likely cause**

- Database initialization did not finish.
- The app was started from a different checkout or working directory.
- `DATABASE_URL` changed.
- A reset or cleanup removed the default database.
- Draft autosave failed or the draft API could not reach SQLite. Run evidence, separately, is saved only after real Piston execution.

**Check**

```bash
npm run doctor
```

Also confirm the current project root. Inspect `DATABASE_URL` locally without printing `.env.local`.

**Fix**

1. Run `npm run setup` in the intended project folder.
2. Restart the WebUI from that same folder.
3. Complete or skip onboarding and refresh.
4. For drafts, type a small change, wait for the Workbench autosave indicator (about 800 ms under normal conditions), then refresh. Piston is not required for draft autosave.

**Success looks like**

- Onboarding remains completed after refresh.
- An autosaved draft remains after refresh; real execution/history records remain after restart.

## LeetCode Credential Questions

### LeetCode Session is invalid or expired

**Symptom**

You found an older instruction mentioning a LeetCode Session, or added a cookie but PatternCoach does not recognize it.

**Likely cause**

Public v0.1 does not implement LeetCode account integration. It has no supported Session variable or verification command. Expiration is therefore not an application failure in this release.

**Check**

Confirm that you are using public v0.1 documentation. The public environment template contains no LeetCode credential fields.

**Fix**

- Do not add or refresh a LeetCode Session for PatternCoach public v0.1.
- Remove unsupported cookie values from local scratch files.
- If you pasted a Session into chat, an issue, or another service, sign out/revoke the session through the account and treat it as exposed.
- Continue with the local catalog and visible-test workflow.

Do not send the cookie to Codex for validation.

**Success looks like**

- PatternCoach runs without a LeetCode credential.
- No Session appears in local configuration or shared diagnostics.

### CSRF mismatch

**Symptom**

An older private-development instruction mentions a CSRF token, or you see a CSRF mismatch while trying to build an unsupported LeetCode request yourself.

**Likely cause**

Public v0.1 has no LeetCode HTTP client, CSRF variable, submit route, or account-history import path.

**Check**

There is no supported PatternCoach CSRF check to run.

**Fix**

Remove the unsupported account-integration configuration and use local execution. Do not weaken browser security, disable CSRF protection, or copy cookies between accounts.

**Success looks like**

- The supported local workflow runs without Session or CSRF values.

## Coach Provider Problems

### LLM configuration is missing or incomplete

**Symptom**

- The Workbench says LLM configuration is incomplete.
- `npm run doctor` prints `CHECK Coach provider`.
- `npm run coach:smoke` asks for all three settings.

**Likely cause**

Exactly one or two of these fields have values:

- `LLM_BASE_URL`;
- `LLM_API_KEY`;
- `LLM_MODEL`.

All blank means built-in local Coach. All present means external Coach. A partial set is rejected.

**Check**

Open `.env.local` in a local editor. Do not print the file in the terminal and do not paste it into chat.

**Fix**

Choose one complete state:

- **Local Coach:** leave all three fields blank.
- **External Coach:** fill all three with values from the provider.

Then stop the WebUI with `Ctrl+C` and restart:

```bash
npm run dev
```

For external mode, run in a second terminal:

```bash
npm run coach:smoke
```

**Success looks like**

- Local mode: doctor prints `built-in local Coach` and the UI labels it local.
- External mode: the Coach smoke returns PASS and the UI labels it external.

### LLM authentication fails

**Symptom**

- `npm run coach:smoke` fails after all three settings are present.
- Review or Chat reports that the configured provider could not be reached.
- The provider dashboard shows a rejected request.

**Likely cause**

- The API key is incorrect, expired, revoked, or lacks required permissions.
- The base URL belongs to a different provider/account environment.
- The provider requires an account or billing state that is not active.
- Whitespace was copied into a value.

The public client intentionally replaces low-level provider errors with a generic connectivity message, so authentication, model, and network failures may look similar in PatternCoach.

**Check**

1. Open `.env.local` locally.
2. Compare the base URL and model name with the provider's documentation.
3. Check the key's status in the provider's account console.
4. Run `npm run coach:smoke` without adding the key to the command.

Do not run a diagnostic command that prints the key or Authorization header.

**Fix**

- Correct or rotate the key in the provider console.
- Enter the replacement yourself in `.env.local`.
- Restart the WebUI.
- Rerun the Coach smoke.

If you want to continue without the provider, clear all three LLM fields and restart to return to the built-in local Coach.

**Success looks like**

```text
PASS: the configured Coach provider completed an OpenAI-compatible tool-call round trip.
```

### The provider model is not found

**Symptom**

The provider rejects the configured model, or the Coach smoke returns the generic provider failure even though the key is valid.

**Likely cause**

- `LLM_MODEL` is a display name rather than the provider's API model identifier.
- The model is not enabled for the account or endpoint.
- The base URL and model belong to different provider APIs.

PatternCoach does not discover models and does not contain a verified provider/model list.

**Check**

Use the provider's own documentation or dashboard to confirm the exact model identifier. Inspect only the `LLM_MODEL` line in your local editor; do not share the full environment file.

**Fix**

Update `LLM_MODEL` locally, restart the WebUI, and run:

```bash
npm run coach:smoke
```

Do not guess through a large sequence of model names if the provider can show the allowed identifiers.

**Success looks like**

- The provider accepts the model.
- The Coach smoke prints PASS.

### The LLM base URL or network is wrong

**Symptom**

- The Coach smoke fails with the generic provider message.
- The request hangs briefly and fails.
- A valid key and model work in the provider's own tools but not through PatternCoach.

**Likely cause**

- `LLM_BASE_URL` is missing the provider-required API prefix, often a version path.
- The endpoint does not implement OpenAI-compatible Chat Completions function tools.
- DNS, TLS, a proxy, or a firewall blocks the request.
- The provider takes longer than the public client's 15-second timeout.

**Check**

Compare the local base URL to the provider's documentation. PatternCoach uses the OpenAI client Chat Completions function-tool interface, has no retries, and uses a 15-second request timeout.

Do not test by placing the key in `curl`, a URL, or shell history.

**Fix**

1. Correct `LLM_BASE_URL` in `.env.local` using the provider's documented compatible endpoint.
2. Confirm that the endpoint/model supports Chat Completions and function tools.
3. Restart the WebUI.
4. Run `npm run coach:smoke`.
5. If a managed network blocks the provider, follow your organization's approved network process rather than disabling security software.

**Success looks like**

- The Coach smoke completes the function-tool round trip within the client timeout.

### External Coach does not silently fall back

**Symptom**

Review or Chat fails after external configuration instead of returning a built-in local response.

**Likely cause**

This is intentional. When all external fields are configured, a provider failure is surfaced. The app does not label a deterministic fallback as an external model response.

**Check**

```bash
npm run coach:smoke
```

**Fix**

- Repair the provider configuration; or
- clear all three LLM fields in `.env.local`, restart, and deliberately return to local mode.

**Success looks like**

- External mode passes the smoke and is labeled external; or
- local mode is explicitly labeled built-in local Coach.

### External Coach context or privacy concern

**Symptom**

You are unsure what data will be sent to the provider, or you do not want a draft or learning summary to leave the computer.

**Likely cause**

External coaching requires sending selected current context to the configured API.

**Check**

Review the [What leaves your computer](./user-setup.md#what-leaves-your-computer) section before enabling the provider.

**Fix**

Leave all LLM settings blank and use the built-in local Coach. If a provider was already configured, clear all three values locally, restart the WebUI, and rotate the key if it was exposed outside the intended local file.

**Success looks like**

- The Workbench labels the Coach local.
- No external Coach request is made because the three LLM fields are blank.

## WebUI and End-to-End Problems

### The page opens but an action fails

**Symptom**

- The UI loads, but onboarding, Chat, Run, Review, planner, or notes fail.
- A browser action returns HTTP 500.
- The Workbench loads defaults but cannot persist data.

**Likely cause**

The Next.js page and API routes are in one process, but individual actions still depend on SQLite, Piston, or the external provider:

- onboarding and most durable actions need SQLite;
- Run and Review need Piston;
- Review additionally requires real executed evidence;
- external Chat/Review need the provider.

**Check**

In a second terminal in the project root:

```bash
npm run doctor
```

Then run the component-specific smoke if applicable:

```bash
npm run piston:smoke
npm run coach:smoke
```

Run the Coach smoke only when external mode is configured.

Also read the terminal where `npm run dev` is running. Do not share the entire terminal without checking for code, chat text, local paths, or provider details.

**Fix**

Repair the first failed dependency:

- SQLite → rerun setup after protecting existing data;
- Piston → start it and pass the Python smoke;
- external Coach → correct all three fields and pass the Coach smoke.

Restart the WebUI after environment changes.

**Success looks like**

- The relevant smoke passes.
- The browser action succeeds after refresh.
- Durable data remains after another refresh.

### Review asks for real Piston evidence

**Symptom**

`Review My Code` says that Review requires real local Piston evidence.

**Likely cause**

Piston was unavailable, the language/test preflight failed, or the run did not return `executed` evidence. PatternCoach intentionally refuses to persist or review unavailable evidence as though code ran.

**Check**

```bash
npm run piston:smoke
```

In the Workbench, also confirm:

- the language is Python;
- code is present;
- at least one visible test is selected;
- custom test JSON matches the problem input shape.

**Fix**

Pass the Piston smoke, refresh the Workbench, and request Review again. Review performs its own fresh Piston execution; it does not require a separate Run click first.

**Success looks like**

- Review's fresh execution produces real local evidence.
- Review persists and returns Coach feedback only after that executed evidence exists.

### The browser opens the wrong or stale app

**Symptom**

<http://localhost:3000> shows unexpected content, old behavior, or a different project.

**Likely cause**

Another process already owned fixed port 3000, or an older PatternCoach server remained running from a different folder.

**Check**

Look at every terminal that may be running `npm run dev`, then identify the port owner using the commands in [Port 3000 is already in use](#port-3000-is-already-in-use).

**Fix**

Stop the stale server through the terminal that launched it. From the intended project root, run:

```bash
npm run dev
```

Do not move the new server to another port; that can hide the stale-backend problem.

**Success looks like**

- The terminal and browser both point to the intended source folder and <http://localhost:3000>.

### `.env.local` changes do not take effect

**Symptom**

The UI still shows the old Coach status or Piston URL after editing `.env.local`.

**Likely cause**

The running Next.js process loaded environment values before the edit.

**Check**

Confirm in a local editor that the intended file is named `.env.local` and is in the project root. Do not print it.

**Fix**

Stop the WebUI with `Ctrl+C` and restart:

```bash
npm run dev
```

Refresh the browser. If Piston settings changed, restart Piston when appropriate and rerun its smoke.

**Success looks like**

- The UI reports the intended Coach status.
- The relevant smoke uses the intended local endpoint.

## Safe Logs and Diagnostics

### How to view logs safely

**Symptom**

You need more detail than the browser message provides.

**Likely cause**

The browser intentionally shows concise errors. The local process or container can have more context.

**Check**

For the WebUI and API routes, inspect the terminal running:

```bash
npm run dev
```

For Piston, follow only this project's container logs:

```bash
npm run piston:logs
```

For component state:

```bash
npm run doctor
docker compose -f piston/docker-compose.yml ps
```

**Fix**

Before sharing any excerpt:

1. Copy only the smallest relevant section.
2. Remove usernames and local filesystem paths if they identify you.
3. Remove code, chat messages, learner data, request bodies, URLs containing private account identifiers, and headers.
4. Never include `.env.local`, database contents, or runtime package listings.
5. Preserve the error type, command name, and exit status.

There is no dedicated safe diagnostic bundle in public v0.1. Manual redaction is required.

**Success looks like**

- The diagnostic contains enough context to identify the failing component.
- It contains no credential, private code, database content, or account cookie.

## Scoped Recovery

### Reset the current PatternCoach project

**Symptom**

The local database is disposable and irreparably inconsistent, or you intentionally want to erase all learner data and start onboarding again.

**Likely cause**

This is a deliberate data reset, not a routine first repair. Public v0.1 has no automated reset command.

**Check**

Before deleting anything:

- confirm the WebUI is stopped;
- confirm the current folder contains `package.json` and `prisma/schema.prisma`;
- confirm `DATABASE_URL` uses the default `data/patterncoach.db` path;
- create and verify a backup;
- decide whether Piston runtime files should remain. They are unrelated to learner data.

**Fix**

Follow the exact commands under [Reset only the default PatternCoach database](./user-setup.md#reset-only-the-default-patterncoach-database).

Those commands remove only:

- `data/patterncoach.db`;
- `data/patterncoach.db-wal`;
- `data/patterncoach.db-shm`.

Then they run `npm run setup` to create a new baseline.

Do not run:

- `docker system prune`;
- `docker volume prune`;
- a broad home-directory or parent-directory delete;
- the default reset commands with a custom `DATABASE_URL`.

**Success looks like**

- Setup reports a new database and 150 contracts.
- The browser returns to onboarding.
- The backup remains available.
- Other projects and Docker resources are unchanged.

### Remove or reset only Piston

**Symptom**

You want to stop the code runner, remove its container, or deliberately clear only its installed runtime.

**Likely cause**

Piston lifecycle is separate from the WebUI and SQLite data.

**Check**

```bash
docker compose -f piston/docker-compose.yml ps
```

The compose file has no named Docker volume. Runtime packages are bind-mounted at `piston/data/packages/`.

**Fix**

To remove only the container and Compose network while keeping Python packages:

```bash
npm run piston:down
```

To deliberately clear the runtime store, use the guarded platform-specific commands under [Clear only the PatternCoach Piston runtime store](./user-setup.md#clear-only-the-patterncoach-piston-runtime-store).

Do not use global Docker cleanup commands.

**Success looks like**

- Stopping/removing Piston does not change the SQLite database.
- Keeping the runtime directory allows it to survive a normal `piston:down`/`piston:up` cycle.
- Clearing that directory causes the next smoke to report Python missing until you approve reinstalling it.

## Still Blocked?

Collect this minimal, redacted report:

```text
Operating system:
Shell (PowerShell, Terminal, WSL, etc.):
Chosen setup level (minimum / Piston / external Coach):
Command that failed:
Exit code:
First relevant error line (redacted):
Doctor PASS/CHECK lines (redacted):
Piston smoke final line, if applicable:
Coach smoke final line, if applicable:
```

Do not attach `.env.local`, a database, a cookie, a full terminal dump, or a Piston runtime directory. If you are unsure whether a line contains a secret, redact the value and keep only the variable or header name.
