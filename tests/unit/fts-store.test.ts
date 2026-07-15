import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveSqliteFilePath } from "@/server/db/sqlite-path";
import { createFtsStore } from "@/server/memory/store/fts-store";

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

function tempDbPath() {
  const dir = mkdtempSync(join(tmpdir(), "pc-fts-"));
  dirs.push(dir);
  return join(dir, "test.db");
}

describe("fts-store", () => {
  it("resolves relative DATABASE_URL paths from the project working directory", () => {
    expect(resolveSqliteFilePath("file:./dev.db", "/repo")).toBe(
      "/repo/dev.db",
    );
    expect(resolveSqliteFilePath("file:./prisma/dev.db", "/repo")).toBe(
      "/repo/prisma/dev.db",
    );
    expect(resolveSqliteFilePath("./eval.db", "/repo")).toBe(
      "/repo/eval.db",
    );
  });

  it("indexes and searches documents with bm25 ranking, filtered by kind", () => {
    const store = createFtsStore(tempDbPath());

    store.indexMemoryDocument({
      kind: "episode",
      refId: "e1",
      content: "Binary search right boundary off by one, review failed",
    });
    store.indexMemoryDocument({
      kind: "episode",
      refId: "e2",
      content: "Hash map two sum passed all visible tests",
    });
    store.indexMemoryDocument({
      kind: "fact",
      refId: "f1",
      content: "weakness binary_search off_by_one boundary",
    });

    const hits = store.searchMemoryFts("binary search boundary", {
      kind: "episode",
      limit: 5,
    });
    expect(hits.map((hit) => hit.refId)).toEqual(["e1"]);
    expect(store.searchMemoryFts("binary boundary", { limit: 5 }).length).toBe(
      2,
    );

    store.close();
  });

  it("re-indexing the same refId replaces the old document", () => {
    const store = createFtsStore(tempDbPath());

    store.indexMemoryDocument({
      kind: "fact",
      refId: "f1",
      content: "old sliding window",
    });
    store.indexMemoryDocument({
      kind: "fact",
      refId: "f1",
      content: "new binary search",
    });

    expect(store.searchMemoryFts("sliding", { limit: 5 })).toEqual([]);
    expect(store.searchMemoryFts("binary", { limit: 5 })[0]?.refId).toBe(
      "f1",
    );

    store.close();
  });

  it("returns empty on queries with no token overlap instead of throwing", () => {
    const store = createFtsStore(tempDbPath());

    expect(
      store.searchMemoryFts("没有命中的中文 query!!", { limit: 5 }),
    ).toEqual([]);

    store.close();
  });
});
