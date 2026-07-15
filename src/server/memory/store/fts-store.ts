import { createRequire } from "node:module";
import { loadLocalEnv } from "@/lib/env";
import {
  DEFAULT_DATABASE_URL,
  resolveSqliteFilePath,
} from "@/server/db/sqlite-path";

// FTS5 virtual tables are not Prisma-owned. Relational tables remain the source
// of truth, and this index can be rebuilt at any time.
const require = createRequire(import.meta.url);

type SqliteStatement = {
  run: (...args: unknown[]) => unknown;
  all: (...args: unknown[]) => unknown[];
};

type SqliteDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatement;
  close: () => void;
};

type SqliteConstructor = new (path: string) => SqliteDatabase;

const Database = require("better-sqlite3") as SqliteConstructor;

export type MemoryDocumentKind =
  | "episode"
  | "fact"
  | "kb"
  | "knowledge_note";

export type FtsHit = {
  refId: string;
  kind: MemoryDocumentKind;
  rank: number;
};

export type FtsStore = {
  indexMemoryDocument: (doc: {
    kind: MemoryDocumentKind;
    refId: string;
    content: string;
  }) => void;
  removeMemoryDocument: (refId: string) => void;
  searchMemoryFts: (
    query: string,
    options: { kind?: MemoryDocumentKind; limit: number },
  ) => FtsHit[];
  close: () => void;
};

export function createFtsStore(dbFilePath: string): FtsStore {
  const db = new Database(dbFilePath);

  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(
    content,
    kind UNINDEXED,
    ref_id UNINDEXED,
    tokenize = 'unicode61'
  );`);

  const deleteByRefId = db.prepare("DELETE FROM memory_fts WHERE ref_id = ?");
  const insertDocument = db.prepare(
    "INSERT INTO memory_fts (content, kind, ref_id) VALUES (?, ?, ?)",
  );
  const searchAll = db.prepare(`SELECT ref_id, kind, bm25(memory_fts) AS rank
    FROM memory_fts
    WHERE memory_fts MATCH ?
    ORDER BY rank
    LIMIT ?`);
  const searchByKind = db.prepare(`SELECT ref_id, kind, bm25(memory_fts) AS rank
    FROM memory_fts
    WHERE memory_fts MATCH ? AND kind = ?
    ORDER BY rank
    LIMIT ?`);

  return {
    indexMemoryDocument(doc) {
      deleteByRefId.run(doc.refId);
      insertDocument.run(doc.content, doc.kind, doc.refId);
    },
    removeMemoryDocument(refId) {
      deleteByRefId.run(refId);
    },
    searchMemoryFts(query, options) {
      const match = toFtsMatchQuery(query);
      const limit = normalizeLimit(options.limit);

      if (!match || limit === 0) {
        return [];
      }

      const rows = (options.kind
        ? searchByKind.all(match, options.kind, limit)
        : searchAll.all(match, limit)) as Array<{
        ref_id: string;
        kind: MemoryDocumentKind;
        rank: number;
      }>;

      return rows.map((row) => ({
        refId: row.ref_id,
        kind: row.kind,
        rank: row.rank,
      }));
    },
    close() {
      db.close();
    },
  };
}

let defaultStore: FtsStore | undefined;

export function getDefaultFtsStore(): FtsStore {
  if (!defaultStore) {
    loadLocalEnv();

    const url = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
    const dbFilePath = resolveSqliteFilePath(url);
    defaultStore = createFtsStore(dbFilePath);
  }

  return defaultStore;
}

function toFtsMatchQuery(query: string): string | undefined {
  const tokens = query
    .split(/[^\p{L}\p{N}_]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);

  if (tokens.length === 0) {
    return undefined;
  }

  return tokens.map((token) => `"${token.replaceAll('"', "")}"`).join(" OR ");
}

function normalizeLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return 0;
  }

  return Math.max(0, Math.floor(limit));
}
