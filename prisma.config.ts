import { defineConfig } from "prisma/config";
import {
  DEFAULT_DATABASE_URL,
  resolveSqliteFilePath,
} from "./src/server/db/sqlite-path";

const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: `file:${resolveSqliteFilePath(databaseUrl)}`,
  },
  migrations: {
    path: "prisma/migrations",
    seed: "node node_modules/.bin/tsx prisma/seed.ts",
  },
});
