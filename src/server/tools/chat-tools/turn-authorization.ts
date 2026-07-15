import {
  authorizeDurableWrite,
  publicDurableWriteTools,
  type PublicDurableWriteTool,
} from "./durable-write-authorization";

export type TurnAuthorization = {
  durableWrites: Partial<Record<PublicDurableWriteTool, true>>;
};

export function buildTurnAuthorization(args: {
  userMessage: string;
  confirmedTool?: PublicDurableWriteTool;
}): TurnAuthorization {
  const durableWrites: Partial<Record<PublicDurableWriteTool, true>> = {};
  for (const tool of publicDurableWriteTools) {
    if (authorizeDurableWrite({ tool, ...args }).allowed) durableWrites[tool] = true;
  }
  return { durableWrites };
}

export function assertDurableWriteAuthorized(
  authorization: TurnAuthorization,
  tool: PublicDurableWriteTool,
) {
  if (!authorization.durableWrites[tool]) {
    throw new Error(`Durable write ${tool} requires an explicit user request or confirmation.`);
  }
}
