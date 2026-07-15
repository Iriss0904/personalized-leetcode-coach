export const PUBLIC_CHAT_TOOL_MAX_STEPS = 4;
export function boundedToolCalls<T>(calls: T[]) { return calls.slice(0, PUBLIC_CHAT_TOOL_MAX_STEPS); }
