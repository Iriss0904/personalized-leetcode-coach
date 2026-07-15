import type { ChatToolName } from "./chat-tool-contracts";
import type { TurnAuthorization } from "./turn-authorization";
export function buildPublicTurnToolPlan(authorization: TurnAuthorization): ChatToolName[] {
  const reads: ChatToolName[] = ["run_current_code", "find_practice_problem", "get_algorithm_hint", "get_mistake_history", "recall_memory"];
  return [...reads, ...Object.keys(authorization.durableWrites) as ChatToolName[]];
}
