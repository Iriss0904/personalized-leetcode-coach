import { z } from "zod";
import { loadLocalEnv } from "@/lib/env";
import {
  pistonExecuteResponseSchema,
  type PistonExecuteResponse,
} from "./normalize-run-result";

const pistonPackageSchema = z.object({
  language: z.string(),
  language_version: z.string(),
  installed: z.boolean(),
});

export type PistonClientOptions = {
  baseUrl?: string;
};

export type PistonExecuteRequest = {
  language: string;
  version: string;
  files: Array<{ name?: string; content: string; encoding?: "utf8" }>;
  stdin?: string;
  args?: string[];
  compile_timeout?: number;
  run_timeout?: number;
  compile_cpu_time?: number;
  run_cpu_time?: number;
  compile_memory_limit?: number;
  output_max_size?: number;
  run_memory_limit?: number;
};

export class PistonClient {
  private readonly baseUrl: string;

  constructor(options: PistonClientOptions = {}) {
    loadLocalEnv();

    this.baseUrl = (
      options.baseUrl ??
      process.env.PISTON_URL ??
      "http://localhost:2000"
    ).replace(/\/$/, "");
  }

  async execute(request: PistonExecuteRequest): Promise<PistonExecuteResponse> {
    const response = await fetch(`${this.baseUrl}/api/v2/execute`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });
    const body = (await response.json().catch(() => ({}))) as unknown;

    if (!response.ok) {
      return pistonExecuteResponseSchema.parse({
        message:
          typeof body === "object" &&
          body !== null &&
          "message" in body &&
          typeof body.message === "string"
            ? body.message
            : `Piston execute failed with HTTP ${response.status}.`,
      });
    }

    return pistonExecuteResponseSchema.parse(body);
  }

  async listPackages() {
    const response = await fetch(`${this.baseUrl}/api/v2/packages`);
    const body = (await response.json()) as unknown;

    if (!response.ok) {
      throw new Error(`Piston package list failed with HTTP ${response.status}.`);
    }

    return z.array(pistonPackageSchema).parse(body);
  }

  async installPackage(language: string, version = "*") {
    const response = await fetch(`${this.baseUrl}/api/v2/packages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ language, version }),
    });
    const body = (await response.json().catch(() => ({}))) as unknown;

    if (!response.ok) {
      const message =
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof body.message === "string"
          ? body.message
          : `Piston package install failed with HTTP ${response.status}.`;
      throw new Error(message);
    }

    return body;
  }
}
