import { getCoachProviderStatus, loadLocalEnv } from "@/lib/env";
import {
  requestPublicCoachTurn,
  type PublicCoachMessage,
  type PublicCoachTool,
} from "@/server/llm/client";

loadLocalEnv();

if (getCoachProviderStatus() !== "external") {
  console.error(
    "FAIL: set LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL in .env.local before running this check.",
  );
  process.exit(1);
}

try {
  const tool: PublicCoachTool = {
    type: "function",
    function: {
      name: "patterncoach_tool_probe",
      description: "Return a fixed local diagnostic value. Call this tool exactly once.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  };
  const messages: PublicCoachMessage[] = [
    {
      role: "user",
      content: "Call patterncoach_tool_probe exactly once, then wait for its result.",
    },
  ];
  const first = await requestPublicCoachTurn({ messages, tools: [tool] });
  const call = first?.toolCalls.find(({ name }) => name === "patterncoach_tool_probe");
  if (!call) throw new Error("The provider did not return the required function tool call.");
  messages.push({
    role: "assistant",
    content: first?.content,
    tool_calls: [{
      id: call.id,
      type: "function",
      function: { name: call.name, arguments: call.arguments },
    }],
  });
  messages.push({
    role: "tool",
    tool_call_id: call.id,
    content: JSON.stringify({ ok: true, diagnostic: "tool-result-received" }),
  });
  const final = await requestPublicCoachTurn({ messages });
  if (!final?.content) throw new Error("The provider did not produce a final response after the tool result.");
  console.log("PASS: the configured Coach provider completed an OpenAI-compatible tool-call round trip.");
} catch (error) {
  console.error(
    `FAIL: ${error instanceof Error ? error.message : "Coach provider check failed."}`,
  );
  process.exit(1);
}
