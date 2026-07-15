import { copyFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (!existsSync(".env.local")) {
  copyFileSync(".env.example", ".env.local");
  console.log("Created .env.local from the safe example.");
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCommand, ["run", "db:init"], {
  stdio: "inherit",
  env: process.env,
});
if (result.status !== 0) process.exit(result.status ?? 1);

console.log("PatternCoach AI local setup is ready.");
console.log("Next: start Piston with `npm run piston:up`, then run `npm run doctor`.");
console.log("Open http://localhost:3000 after `npm run dev` to create your local Profile.");
