import { loadLocalEnv } from "@/lib/env";
import {
  isPublicPythonRuntime,
  PUBLIC_PYTHON_RUNTIME,
} from "@/server/tools/code-runner/runtime-config";

loadLocalEnv();

const baseUrl = (process.env.PISTON_URL ?? "http://127.0.0.1:2000").replace(/\/$/, "");

async function main() {
  const runtimesResponse = await fetch(`${baseUrl}/api/v2/runtimes`);
  if (!runtimesResponse.ok) {
    throw new Error(`Piston health check returned HTTP ${runtimesResponse.status}.`);
  }
  const runtimes = (await runtimesResponse.json()) as Array<{
    language?: string;
    version?: string;
  }>;
  const python = runtimes.find(isPublicPythonRuntime);
  if (!python) {
    throw new Error(
      `Piston is reachable, but Python ${PUBLIC_PYTHON_RUNTIME.version} is not installed. Run setup:piston first; install only after approving the download.`,
    );
  }

  const response = await fetch(`${baseUrl}/api/v2/execute`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      language: PUBLIC_PYTHON_RUNTIME.language,
      version: PUBLIC_PYTHON_RUNTIME.version,
      files: [{ name: "main.py", content: "print(6 * 7)" }],
      run_timeout: 3_000,
      run_memory_limit: 128 * 1024 * 1024,
      output_max_size: 1024 * 1024,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as {
    run?: { code?: number; stdout?: string; stderr?: string };
  };
  if (!response.ok || body.run?.code !== 0 || body.run.stdout !== "42\n") {
    throw new Error("Piston executed Python but the smoke output was not correct.");
  }
  console.log(`PASS: real local Python execution (${PUBLIC_PYTHON_RUNTIME.version}).`);
}

main().catch((error: unknown) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : "unknown Piston error"}`);
  process.exit(1);
});
