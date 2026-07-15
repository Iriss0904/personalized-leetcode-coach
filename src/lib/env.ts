import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

let loaded = false;

export function loadLocalEnv(cwd = process.cwd()) {
  if (!loaded) {
    loadEnvConfig(cwd);
    loaded = true;
  }
}

type PublicEnvironment = Record<string, string | undefined>;

export function hasExternalCoachProvider(env: PublicEnvironment = process.env) {
  return Boolean(env.LLM_BASE_URL && env.LLM_API_KEY && env.LLM_MODEL);
}

export function getCoachProviderStatus(
  env: PublicEnvironment = process.env,
): "external" | "local" | "incomplete" {
  const values = [env.LLM_BASE_URL, env.LLM_API_KEY, env.LLM_MODEL];
  const configuredCount = values.filter(Boolean).length;
  if (configuredCount === 0) return "local";
  if (configuredCount === values.length) return "external";
  return "incomplete";
}

export function getPublicEnv(env: PublicEnvironment = process.env) {
  return {
    databaseUrl: env.DATABASE_URL ?? "file:./data/patterncoach.db",
    pistonUrl: env.PISTON_URL ?? "http://127.0.0.1:2000",
    llmBaseUrl: env.LLM_BASE_URL,
    llmApiKey: env.LLM_API_KEY,
    llmModel: env.LLM_MODEL ?? "deepseek-chat",
    llmConfigured: hasExternalCoachProvider(env),
    coachProviderStatus: getCoachProviderStatus(env),
  };
}
