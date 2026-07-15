import { isAbsolute, resolve } from "node:path";

export const DEFAULT_DATABASE_URL = "file:./data/patterncoach.db";

export function resolveSqliteFilePath(
  databaseUrl = DEFAULT_DATABASE_URL,
  cwd = process.cwd(),
) {
  if (!databaseUrl.startsWith("file:")) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(databaseUrl)) {
      throw new Error(`SQLite database URL must start with file:, got ${databaseUrl}`);
    }

    return isAbsolute(databaseUrl) ? databaseUrl : resolve(cwd, databaseUrl);
  }

  const withoutScheme = databaseUrl.slice("file:".length);
  const [rawPath] = withoutScheme.split("?");
  if (!rawPath) {
    throw new Error("SQLite database URL is missing a file path.");
  }

  return isAbsolute(rawPath) ? rawPath : resolve(cwd, rawPath);
}
