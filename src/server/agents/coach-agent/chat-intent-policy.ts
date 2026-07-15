import { buildTurnAuthorization } from "@/server/tools/chat-tools/turn-authorization";

export function resolvePublicChatIntent(message: string) {
  return {
    kind: "coach_chat" as const,
    authorization: buildTurnAuthorization({ userMessage: message }),
  };
}
