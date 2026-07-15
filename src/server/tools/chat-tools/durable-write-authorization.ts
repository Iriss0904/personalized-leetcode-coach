export const publicDurableWriteTools = [
  "note_memory",
  "save_knowledge_note",
  "save_mistake_book_entry",
] as const;

export type PublicDurableWriteTool = (typeof publicDurableWriteTools)[number];

export type DurableWriteAuthorization = {
  allowed: boolean;
  reason: "explicit_request" | "explicit_confirmation" | "not_requested";
};

export function authorizeDurableWrite(args: {
  tool: PublicDurableWriteTool;
  userMessage: string;
  confirmedTool?: PublicDurableWriteTool;
}): DurableWriteAuthorization {
  if (args.confirmedTool === args.tool) {
    return { allowed: true, reason: "explicit_confirmation" };
  }
  const text = args.userMessage.trim();
  const target = targetPattern(args.tool);
  const action = /(?:保存|记录|记住|加入|收录|添加|写入|save|remember|record|add|store)/iu;
  if (action.test(text) && target.test(text)) {
    return { allowed: true, reason: "explicit_request" };
  }
  return { allowed: false, reason: "not_requested" };
}

function targetPattern(tool: PublicDurableWriteTool) {
  if (tool === "note_memory") return /(?:偏好|长期记忆|memory|preference)/iu;
  if (tool === "save_knowledge_note") return /(?:知识手册|知识卡|handbook|knowledge note)/iu;
  return /(?:错题本|mistake book)/iu;
}
