import { describe, expect, it } from "vitest";
import { getCoachProviderStatus, hasExternalCoachProvider } from "@/lib/env";
import { buildTurnAuthorization } from "@/server/tools/chat-tools/turn-authorization";
import { buildPublicTurnToolPlan } from "@/server/tools/chat-tools/turn-tool-plan";

describe("public Coach provider configuration", () => {
  it("uses the local Coach when no external settings are present", () => {
    expect(getCoachProviderStatus({})).toBe("local");
    expect(hasExternalCoachProvider({})).toBe(false);
  });

  it("rejects partial external-provider configuration", () => {
    expect(getCoachProviderStatus({ LLM_API_KEY: "placeholder" })).toBe(
      "incomplete",
    );
  });

  it("recognizes a complete OpenAI-compatible configuration", () => {
    const env = {
      LLM_BASE_URL: "https://provider.example/v1",
      LLM_API_KEY: "placeholder",
      LLM_MODEL: "example-model",
    };
    expect(getCoachProviderStatus(env)).toBe("external");
    expect(hasExternalCoachProvider(env)).toBe(true);
  });

  it("exposes bounded read tools and only explicitly authorized durable writes", () => {
    const ordinary = buildPublicTurnToolPlan(
      buildTurnAuthorization({ userMessage: "Help me understand this draft." }),
    );
    expect(ordinary).toContain("run_current_code");
    expect(ordinary).toContain("recall_memory");
    expect(ordinary).not.toContain("note_memory");

    const explicit = buildPublicTurnToolPlan(
      buildTurnAuthorization({
        userMessage: "Please remember this preference in memory.",
      }),
    );
    expect(explicit).toContain("note_memory");
  });
});
