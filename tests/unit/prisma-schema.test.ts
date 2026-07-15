import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
describe("public Prisma schema", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  it("keeps local learner data and omits excluded stores", () => { expect(schema).toContain("model MemoryEpisode"); expect(schema).toContain("model L2MemoryFact"); expect(schema).not.toMatch(/embedding|sqlite_vec|MockInterview|RuntimeTrace/i); });
});
