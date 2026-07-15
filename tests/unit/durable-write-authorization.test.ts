import { describe, expect, it } from "vitest";
import { authorizeDurableWrite } from "@/server/tools/chat-tools/durable-write-authorization";
describe("durable-write boundary", () => {
  it("denies an inferred write", () => { expect(authorizeDurableWrite({ tool: "note_memory", userMessage: "Python is useful" }).allowed).toBe(false); });
  it("allows an explicit targeted request", () => { expect(authorizeDurableWrite({ tool: "note_memory", userMessage: "Please remember this preference" }).allowed).toBe(true); });
});
