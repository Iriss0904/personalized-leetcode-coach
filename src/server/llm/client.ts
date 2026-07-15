import OpenAI from "openai";
import { getPublicEnv } from "@/lib/env";

export type PublicCoachMessage =
  OpenAI.Chat.Completions.ChatCompletionMessageParam;
export type PublicCoachTool = OpenAI.Chat.Completions.ChatCompletionTool;

export type PublicCoachToolCall = {
  id: string;
  name: string;
  arguments: string;
};

export function createPublicLlmClient() {
  const env = getPublicEnv();
  if (env.coachProviderStatus === "incomplete") {
    throw new Error(
      "Coach provider configuration is incomplete. Set LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL together.",
    );
  }
  if (!env.llmConfigured) return null;
  return new OpenAI({
    apiKey: env.llmApiKey,
    baseURL: env.llmBaseUrl,
    maxRetries: 0,
    timeout: 15_000,
  });
}

export async function requestPublicCoachTurn(args: {
  messages: PublicCoachMessage[];
  tools?: PublicCoachTool[];
}) {
  const env = getPublicEnv();
  const client = createPublicLlmClient();
  if (!client) return null;
  try {
    const result = await client.chat.completions.create({
      model: env.llmModel,
      messages: args.messages,
      temperature: 0.2,
      ...(args.tools?.length
        ? { tools: args.tools, tool_choice: "auto" as const }
        : {}),
    });
    const message = result.choices[0]?.message;
    if (!message) {
      throw new Error("The Coach provider returned an empty response.");
    }
    const toolCalls: PublicCoachToolCall[] = (message.tool_calls ?? [])
      .filter((call) => call.type === "function")
      .map((call) => ({
        id: call.id,
        name: call.function.name,
        arguments: call.function.arguments,
      }));
    const content = message.content?.trim() || null;
    if (!content && toolCalls.length === 0) {
      throw new Error("The Coach provider returned an empty response.");
    }
    return { content, toolCalls };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("Coach provider configuration") ||
        error.message === "The Coach provider returned an empty response.")
    ) {
      throw error;
    }
    throw new Error(
      "The configured Coach provider could not be reached. Check LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL, then try again.",
    );
  }
}

export async function completePublicCoach(
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>,
) {
  const turn = await requestPublicCoachTurn({ messages });
  if (!turn) return null;
  if (!turn.content) {
    throw new Error("The Coach provider returned an empty response.");
  }
  return turn.content;
}
