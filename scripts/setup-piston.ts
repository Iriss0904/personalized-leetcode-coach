import { loadLocalEnv } from "@/lib/env";
import {
  isPublicPythonRuntime,
  PUBLIC_PYTHON_RUNTIME,
} from "@/server/tools/code-runner/runtime-config";

loadLocalEnv();

const baseUrl = (process.env.PISTON_URL ?? "http://127.0.0.1:2000").replace(/\/$/, "");

async function main() {
  try {
    const response = await fetch(`${baseUrl}/api/v2/runtimes`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const runtimes = (await response.json()) as Array<{
      language?: string;
      version?: string;
    }>;
    if (!runtimes.some(isPublicPythonRuntime)) {
      console.error(
        `Piston is healthy, but Python ${PUBLIC_PYTHON_RUNTIME.version} is missing.`,
      );
      console.error(
        "If you approve downloading the runtime, run: npm run piston:install -- --confirm",
      );
      process.exit(2);
    }
    console.log(
      `Piston is reachable and Python ${PUBLIC_PYTHON_RUNTIME.version} is installed.`,
    );
    console.log("Run `npm run piston:smoke` for a real execution check.");
  } catch (error) {
    console.error(`Piston is not reachable at ${baseUrl}.`);
    console.error("Start it with: npm run piston:up");
    console.error(error instanceof Error ? error.message : "Unknown connection error");
    process.exit(1);
  }
}

main();
