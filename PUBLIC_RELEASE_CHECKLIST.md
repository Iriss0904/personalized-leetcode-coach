# PatternCoach AI Public v0.1 Release Checklist

Status: release candidate prepared and end-to-end checked, including an owner-approved Python runtime installation into an empty Piston volume.

## Release scope

- Python-only local product for the complete Hot Interview 150 catalog.
- All 150 problems are browseable and have public-safe Python execution contracts.
- Real code execution uses the user's localhost Piston service.
- Coach Review accepts only real Piston execution evidence; public v0.1 has no simulated execution mode.
- Local Profile, Today, Planner, Workbench, Coach Review, Coach Chat, Problem History, Chat History, Mistake Book, and Knowledge Handbook are included.
- Local persistence uses Prisma, SQLite WAL, SQLite FTS5, deterministic fact retrieval, and recent local episode retrieval.
- C++, LeetCode credentials/remote judge/history import, embedding/sqlite-vec, Mock Interview, Runtime Trace, evaluation, benchmark, reports, experiments, and optimization assets are excluded.

## Source and history boundary

- The public tree was assembled from an owner-reviewed private snapshot using an explicit R1/R2 allowlist; it was not produced by copying the private repository wholesale.
- The preparation workspace retains private Git history. **Do not push its branch to a public remote.**
- The first GitHub publication must create a new repository history from this audited tree, with no private `.git` directory or ancestors.
- No public remote has been configured and no push has been performed.

## Included file inventory

Root and support:

- `.env.example`, `.gitignore`
- `README.md`, `LICENSE`, `NOTICE`
- `HOT150_PUBLIC_CONTENT_AUDIT.md`, `PUBLIC_RELEASE_CHECKLIST.md`
- `package.json`, `package-lock.json`
- Next.js, TypeScript, ESLint, PostCSS, Playwright, Vitest, and Prisma public configuration files
- `piston/docker-compose.yml`

User documentation:

- `docs/architecture-overview.md`
- `docs/privacy.md`
- `docs/user-setup.md`
- `docs/user-guide.md`
- `docs/troubleshooting.md`

Application entry points:

- Public pages under `app/`: Onboarding, Today, Workbench, Profile, Problem History, Chat History, Mistake Book, and Knowledge Handbook
- Public APIs under `app/api/`: Coach review/chat, Workbench run/draft/custom tests, deterministic Planner, and Handbook CRUD

Runtime source:

- Public UI components under `src/components/`
- Public end-user feature modules under `src/features/`
- `src/data/hot150/local-bank.public.ts` and `local-run-types.ts`
- Public Python wrapper, Piston runner, result normalization, and Workbench execution paths under `src/server/tools/code-runner/`
- Public Coach prompt/protocol/orchestration and bounded OpenAI-compatible tool loop under `src/server/agents/coach-agent/`
- Explicit durable-write authorization at `durable-write-authorization.ts` and `turn-authorization.ts`
- SQLite/FTS5 memory, deterministic facts, recent episode retrieval, Planner, growth, history, notebook, and handbook modules
- Shared public runtime types under `src/types/`

Database and setup:

- `prisma/schema.prisma`
- `prisma/migrations/0001_public_baseline/migration.sql`
- `prisma/migrations/migration_lock.toml`
- `prisma/seed.ts` with a local user shell and 150 public problem rows; first-run Onboarding creates the Profile
- Public setup, doctor, database, FTS, Coach provider smoke, Piston health/install/smoke/boundary probes, all-bank Piston verification, and Hot-150 audit scripts under `scripts/`

Public tests:

- Root navigation E2E smoke
- Durable-write authorization
- Evidence trust
- SQLite FTS5
- Piston request/result contract
- Deterministic Planner rules
- Public Prisma schema boundary
- Public Hot-150 runtime completeness

## Explicitly excluded

- `.env`, `.env.local`, credentials, tokens, cookies, private keys, and provider secrets
- Real user databases, database backups/WAL files, learning history, code, chats, memory, profiles, and local state
- Private/generated Hot-150 runtime banks, cached API responses, official full statements, hidden tests, benchmark cases, reference solutions/hashes, gold labels, and provenance
- All `evals/`, benchmark/evaluation datasets, labels, fixtures, reports, experiments, failure analysis, optimization records, and internal audit artifacts
- Runtime Trace and observability implementations/data
- Mock Interview and InterviewerAgent
- LeetCode Session/CSRF clients, remote judge, auto-submit, and history import
- C++ adapters, contracts, UI claims, and tests
- embedding clients, vector stores, sqlite-vec, hybrid retrieval, related environment variables, and tests
- private PRDs/specs/plans, agent delegation instructions, interview preparation material, private prompt cases, and research notes
- private unit/E2E matrices and internal debug/repair/report scripts
- logs, traces, caches, build output, coverage, Docker/Piston runtime data, downloaded runtimes, `node_modules`, and local editor/OS state

## Sanitization performed

- Replaced the private generated bank with an independently authored public runtime bank containing only safe metadata and execution-required contracts.
- Removed raw statements, hidden/private cases, solutions, hashes, labels, provenance, cached responses, and absolute paths.
- Rewrote Coach prompts and policies as simpler public implementations without private few-shot, benchmark, failure, or tuning material.
- Reduced execution to Python plus localhost Piston; removed LeetCode and mock execution providers.
- Reduced memory retrieval to SQLite FTS5, deterministic facts, and recent episodes.
- Replaced fixed personal bootstrap data with first-run local Onboarding.
- Preserved explicit authorization for durable Profile, Memory, Handbook, and Mistake Book writes.
- Excluded the private Runtime Trace browser-session module; the public Monaco editor and Workbench browser flow remain complete.
- Scoped the local database ignore rule to the repository-root `data` directory so essential `src/data` runtime files remain trackable.
- Configured Monaco from the bundled npm package with a bundled editor worker, removing its default CDN dependency and main-thread worker fallback.
- Added dependency overrides for patched `postcss`, `dompurify`, and `@hono/node-server` transitive versions.
- Pinned every installer, health check, request, and Compose check to Python 3.12.0 so a fresh install cannot accidentally select Python 2.
- Added a cross-platform `--confirm` runtime-install flag and aligned the documented Node.js engine range with Prisma's supported versions.
- Declared the digest-pinned Piston image as `linux/amd64`; x86_64 is verified, while ARM64 requires Docker emulation and remains outside the verified v0.1 platform set.
- Connected Planner self-ratings to deterministic `ReviewSchedule` updates and restored unresolved/due problems to the Today review-focus queue.
- Connected public Review and Chat output to the protocol-leak and official-acceptance overclaim guards before display or persistence.
- Marked all database-backed pages as dynamic so `npm run build` succeeds cleanly before the user's local database exists.

## Hot-150 content gate

- Safe metadata entries: 150/150 PASS.
- Python execution contracts: 150/150 PASS.
- Input/output schema, comparator, and wrapper compilation: 150/150 PASS.
- Public synthetic visible-test sets: 150/150 PASS.
- Exported benchmark/hidden/reference/provenance assets: 0.
- Independent release verifier: 150 PASS / 0 BLOCKED using known-correct Python implementations against the public wrappers, adapters, comparators, and visible tests in real Piston. The private correctness oracle was neither printed nor exported.
- Full row-level evidence: `HOT150_PUBLIC_CONTENT_AUDIT.md`.

The owner should review all future BLOCKED rows and a stratified 15-problem sample before the first public commit. Suggested sample: 1, 27, 76, 117, 133, 141, 173, 208, 210, 215, 236, 295, 380, 427, and 72.

## Secret and privacy scan

- Hard-coded API key/token/provider credential patterns: PASS, zero findings.
- Private-key/PEM patterns: PASS, zero findings.
- Credential-bearing database/service URLs: PASS, zero findings.
- Embedded Linux, macOS, or Windows user-home paths: PASS, zero findings.
- Personal handle/private email scan: PASS, zero findings.
- Excluded runtime import scan (LeetCode credentials, vector/sqlite-vec, Mock Interview, Runtime Trace/observability, C++): PASS, zero findings.
- `.env.example` contains variable names and safe blank/local placeholders only.

Run the same scans again against the exact staged path set before committing.

## License and dependency review

- Project license: `AGPL-3.0-only`.
- `LICENSE` is the official unmodified GNU AGPL v3 text, 661 lines, SHA-256 `0d96a4ff68ad6d4b6f1f30f713b18d5184912ba8dd389f86aa7710db079abcb0`.
- Locked npm package map: 832 non-root entries; detailed aggregate and attribution notes are in `NOTICE`.
- One package (`seq-queue`) lacks an SPDX metadata field but includes an MIT license file.
- Piston is referenced as a separate digest-pinned MIT-licensed service; images and downloaded runtimes are not bundled.
- No evident dependency-license incompatibility was found in the reviewed metadata. This is an engineering review, not legal advice.
- AGPL does not grant permission to redistribute third-party LeetCode content; the public bank intentionally excludes protected bulk content.

## Verification results

| Check | Result |
|---|---|
| `npm ci` | PASS — 705 packages installed |
| `npm audit` | PASS — 0 known vulnerabilities |
| `npm audit --omit=dev` | PASS — 0 known vulnerabilities |
| Fresh `npm run setup` | PASS |
| Repeated/idempotent `npm run setup` | PASS |
| Prisma generate/public migration/synthetic seed | PASS — 150 problem rows |
| `npm run validate:hot150` | PASS — 150/150 |
| `npm run verify:hot150:piston` | PASS — all 150 contracts produced complete real Piston test results |
| `npm run audit:hot150 -- --semantic-pass` | PASS — 150 content PASS rows plus the separately completed release-verifier record |
| `npm run lint` | PASS — 0 errors, 0 warnings |
| `npm run typecheck` | PASS |
| `npm run test:smoke` | PASS — 8 files, 20 tests |
| `npm run build` | PASS — clean production build without an initialized default database; expected public routes only |
| `npm run doctor` | PASS — Node, 150/150 bank, SQLite/FTS5, labeled local Coach, and Piston |
| `npm run setup:piston` | PASS — Piston reachable and Python installed |
| `npm run piston:smoke` | PASS — real local Python 3.12 execution |
| `npm run piston:boundary-smoke` | PASS — real syntax-error, runtime-error, and timeout classification |
| `npm run test:e2e` | PASS — fresh temporary SQLite, Chromium, canonical port 3000 |
| End-user browser flow | PASS — first-run Profile, Planner, Monaco keyboard input, real Run/Review, self-rating/ReviewSchedule, Coach `run_current_code`, Problem History, Chat History, and Today review focus |
| Simulated execution scan | PASS — no simulation UI, evidence type, API branch, or persistence path remains |
| Monaco offline loading | PASS — bundled editor and worker, zero external CDN requests or worker fallback warnings |
| Public Piston Compose declaration | PASS — pinned digest, localhost-only port, exact Python 3.12.0 health check |
| OpenAI-compatible request contract | PASS — an isolated compatible endpoint requested `run_current_code`; PatternCoach dispatched it to real Piston, returned executed evidence to the endpoint, received the final Coach reply, and persisted tool call/result/evidence records |
| User-selected real external LLM | NOT RUN — requires the repository user's own provider and private API key; verify with `npm run coach:smoke` |
| Fresh Piston image | PASS — empty volume started with zero runtimes; approved installer downloaded exact Python 3.12.0; setup, smoke, 150/150, boundary probes, and post-restart smoke passed |
| Fresh SQLite + WebUI | PASS — Onboarding, Planner 150, Monaco typing, real Run/Review, Chat, authorized durable writes, all history surfaces, and restart persistence |
| Temporary validation resources | PASS — isolated container/runtime/test database removed after validation; original local Piston left untouched |

The Run/Review flow, all-bank contract verification, boundary probes, and Piston smoke above used real Python execution. The clean-container install used about 1.1 GB of disk; the temporary container was about 353 MiB at idle in this environment. These resource figures are observations, not platform guarantees. The OpenAI-compatible contract check proves request/response integration but is not being represented as proof of any third-party provider.

## Recommended GitHub metadata

Description:

> Local-first Python coach for the Hot Interview 150 catalog, with Piston execution, personalized feedback, deterministic planning, and SQLite memory.

Topics:

`leetcode`, `interview-preparation`, `python`, `nextjs`, `typescript`, `piston`, `sqlite`, `prisma`, `ai-coach`, `local-first`

## Final owner checks before first public commit

- Review the row-level Hot-150 audit and the 15-problem stratified sample.
- Review the exact staged path list; confirm no `.env`, database, backup, log, trace, benchmark, evaluation, report, Piston data, or generated state is staged.
- Repeat the staged secret/path/personal-identifier scans.
- Review `LICENSE`, `NOTICE`, README scope claims, privacy wording, and third-party content boundaries.
- Confirm the documented one-time Python 3.12.0 runtime download and localhost-only Piston setup are acceptable for end users.
- Configure the intended OpenAI-compatible provider privately and run `npm run coach:smoke`; never commit `.env.local`.
- Create the GitHub repository from a new clean history; do not publish this private repository's history.
- Add the public remote and push only after explicit owner approval.
