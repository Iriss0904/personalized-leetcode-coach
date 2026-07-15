import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { loadLocalEnv } from "@/lib/env";
import {
  DEFAULT_DATABASE_URL,
  resolveSqliteFilePath,
} from "@/server/db/sqlite-path";

loadLocalEnv();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
const databasePath = resolveSqliteFilePath(databaseUrl);
mkdirSync(dirname(databasePath), { recursive: true });

run(npmCommand, ["run", "db:generate"]);
if (!hasUserTable(databasePath)) {
  run(npmCommand, ["run", "db:migrate"]);
}
enableWal(databasePath);
run(npmCommand, ["run", "db:seed"]);
run(npmCommand, ["run", "fts:rebuild"]);
console.log(`Local database initialized at ${databasePath}.`);

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function database(path: string) {
  const require = createRequire(import.meta.url);
  const Database = require("better-sqlite3") as new (file: string) => {
    prepare(sql: string): { get(): unknown };
    pragma(value: string): unknown;
    close(): void;
  };
  return new Database(path);
}

function hasUserTable(path: string) {
  const db = database(path);
  try {
    return Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='User'").get());
  } finally {
    db.close();
  }
}

function enableWal(path: string) {
  const db = database(path);
  try {
    db.pragma("journal_mode = WAL");
  } finally {
    db.close();
  }
}
