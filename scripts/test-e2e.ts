import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const databaseRelativePath = "./data/patterncoach-e2e.db";
const databasePath = resolve("data/patterncoach-e2e.db");
const env = {
  ...process.env,
  CI: "1",
  DATABASE_URL: `file:${databaseRelativePath}`,
};

removeDatabase();
try {
  run("npm", ["run", "db:init"]);
  run("npx", ["playwright", "test", "tests/e2e/root-smoke.spec.ts"]);
} catch (error) {
  const failure = error as { exitCode?: number; message?: string };
  console.error(failure.message ?? "End-to-end validation failed.");
  process.exitCode = failure.exitCode ?? 1;
} finally {
  removeDatabase();
}

function run(command: string, args: string[]) {
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, { env, stdio: "inherit" });
  if (result.status !== 0) {
    throw Object.assign(new Error(`${command} ${args.join(" ")} failed.`), {
      exitCode: result.status ?? 1,
    });
  }
}

function removeDatabase() {
  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(`${databasePath}${suffix}`, { force: true });
  }
}
