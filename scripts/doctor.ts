import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { publicHot150Bank } from "@/data/hot150/local-bank.public";
import { getCoachProviderStatus, loadLocalEnv } from "@/lib/env";
import {
  DEFAULT_DATABASE_URL,
  resolveSqliteFilePath,
} from "@/server/db/sqlite-path";
import {
  isPublicPythonRuntime,
  PUBLIC_PYTHON_RUNTIME,
} from "@/server/tools/code-runner/runtime-config";

loadLocalEnv();

const results: Array<{ check: string; ok: boolean; detail: string }> = [];
results.push({
  check: "Node.js",
  ok: isSupportedNodeVersion(process.versions.node),
  detail: process.versions.node,
});
results.push({
  check: "Hot-150 bank",
  ok: publicHot150Bank.problems.length === 150,
  detail: `${publicHot150Bank.problems.length}/150 contracts`,
});

const dbPath = resolveSqliteFilePath(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL);
if (!existsSync(dbPath)) {
  results.push({ check: "SQLite", ok: false, detail: "not initialized; run npm run setup" });
} else {
  try {
    const require = createRequire(import.meta.url);
    const Database = require("better-sqlite3") as new (file: string, options?: { readonly?: boolean }) => {
      prepare(sql: string): { get(): Record<string, unknown> | undefined };
      close(): void;
    };
    const db = new Database(dbPath, { readonly: true });
    try {
      const problemCount = Number(db.prepare('SELECT COUNT(*) AS count FROM "Problem"').get()?.count ?? 0);
      const ftsReady = Boolean(
        db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='memory_fts'").get(),
      );
      results.push({
        check: "SQLite",
        ok: problemCount === 150 && ftsReady,
        detail: `${problemCount}/150 problems; FTS5 ${ftsReady ? "ready" : "missing"}`,
      });
    } finally {
      db.close();
    }
  } catch {
    results.push({ check: "SQLite", ok: false, detail: "cannot read the public schema; run npm run setup" });
  }
}

const coachProviderStatus = getCoachProviderStatus();
results.push({
  check: "Coach provider",
  ok: coachProviderStatus !== "incomplete",
  detail:
    coachProviderStatus === "external"
      ? "external provider configured (run npm run coach:smoke to verify it)"
      : coachProviderStatus === "local"
        ? "built-in local Coach"
        : "incomplete; set LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL together",
});

try {
  const response = await fetch(`${(process.env.PISTON_URL ?? "http://127.0.0.1:2000").replace(/\/$/, "")}/api/v2/runtimes`, {
    signal: AbortSignal.timeout(3_000),
  });
  const runtimes = response.ok
    ? (await response.json()) as Array<{ language?: string; version?: string }>
    : [];
  const pythonReady = runtimes.some(isPublicPythonRuntime);
  results.push({
    check: "Piston",
    ok: response.ok && pythonReady,
    detail: response.ok
      ? (pythonReady
        ? `reachable; Python ${PUBLIC_PYTHON_RUNTIME.version} ready`
        : `reachable; Python ${PUBLIC_PYTHON_RUNTIME.version} missing`)
      : `HTTP ${response.status}`,
  });
} catch {
  results.push({ check: "Piston", ok: false, detail: "not reachable; required for Run Code" });
}

for (const result of results) {
  console.log(`${result.ok ? "PASS" : "CHECK"}  ${result.check}: ${result.detail}`);
}
if (results.some((result) => !result.ok)) process.exit(1);

function isSupportedNodeVersion(version: string) {
  const [major = 0, minor = 0] = version.split(".").map(Number);
  return (
    (major === 20 && minor >= 19) ||
    (major === 22 && minor >= 12) ||
    major >= 24
  );
}
