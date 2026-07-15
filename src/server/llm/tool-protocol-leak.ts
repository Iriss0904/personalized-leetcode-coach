import { createHash } from "node:crypto";

export type ToolProtocolSentinelId =
  | "dsml_tool_calls"
  | "dsml_invoke"
  | "dsml_parameter"
  | "provider_tool_calls_begin"
  | "provider_tool_call_begin"
  | "provider_tool_sep"
  | "provider_tool_calls_end"
  | "xml_tool_calls_block"
  | "provider_function_call";

export type SafeProtocolLeakSummary = {
  sentinelIds: ToolProtocolSentinelId[];
  contentLength: number;
  contentSha256: string;
  finishReason: string | null;
};

const SAFE_REPLACEMENT = "[Tool protocol output removed by safety guard]";
const VERTICAL_LINE_GLYPHS = /[|｜￨∣ǀ❘⏐⎪]/gu;
const INVISIBLE_FORMATTING = /[\u200b\u200c\u200d\u2060\ufeff]/gu;

const STRONG_SENTINELS: ReadonlyArray<{
  id: ToolProtocolSentinelId;
  pattern: RegExp;
}> = [
  {
    id: "dsml_tool_calls",
    pattern: /<\s*\/?\s*\|\s*\|\s*dsml\s*\|\s*\|\s*tool[\s_-]*calls\b/iu,
  },
  {
    id: "dsml_invoke",
    pattern: /<\s*\/?\s*\|\s*\|\s*dsml\s*\|\s*\|\s*invoke\b/iu,
  },
  {
    id: "dsml_parameter",
    pattern: /<\s*\/?\s*\|\s*\|\s*dsml\s*\|\s*\|\s*parameter\b/iu,
  },
  {
    id: "provider_tool_calls_begin",
    pattern: /<\s*\|\s*tool(?:[_\s]|▁)*calls(?:[_\s]|▁)*begin\s*\|\s*>/iu,
  },
  {
    id: "provider_tool_call_begin",
    pattern: /<\s*\|\s*tool(?:[_\s]|▁)*call(?:[_\s]|▁)*begin\s*\|\s*>/iu,
  },
  {
    id: "provider_tool_sep",
    pattern: /<\s*\|\s*tool[_\s]*sep\s*\|\s*>/iu,
  },
  {
    id: "provider_tool_calls_end",
    pattern: /<\s*\|\s*tool[_\s]*calls[_\s]*end\s*\|\s*>/iu,
  },
  {
    id: "xml_tool_calls_block",
    pattern: /^\s*<tool_calls\b[^>]*>[\s\S]*?<\/tool_calls\s*>/imu,
  },
  {
    id: "provider_function_call",
    pattern: /<\s*\|\s*function[_\s]*call\s*\|\s*>/iu,
  },
];

export function detectToolProtocolLeak(
  content: string,
  options: { finishReason?: string | null } = {},
): SafeProtocolLeakSummary | null {
  if (!content) {
    return null;
  }

  const matchable = normalizeProtocolText(maskMarkdownCode(content));
  const sentinelIds = STRONG_SENTINELS.filter(({ pattern }) =>
    pattern.test(matchable),
  ).map(({ id }) => id);

  if (sentinelIds.length === 0) {
    return null;
  }

  return {
    sentinelIds,
    contentLength: content.length,
    contentSha256: createHash("sha256").update(content).digest("hex"),
    finishReason: options.finishReason ?? null,
  };
}

export function sanitizeToolProtocolText(
  content: string,
  options: { finishReason?: string | null; replacement?: string } = {},
): {
  text: string;
  replaced: boolean;
  leak: SafeProtocolLeakSummary | null;
} {
  const leak = detectToolProtocolLeak(content, options);

  if (!leak) {
    return { text: content, replaced: false, leak: null };
  }

  return {
    text: options.replacement ?? SAFE_REPLACEMENT,
    replaced: true,
    leak,
  };
}

function normalizeProtocolText(content: string) {
  return content
    .normalize("NFKC")
    .replace(VERTICAL_LINE_GLYPHS, "|")
    .replace(INVISIBLE_FORMATTING, "")
    .toLowerCase();
}

/**
 * Protocol-looking text inside Markdown code is teaching content, not an
 * executable provider response. Replace code spans with spaces so sentinel
 * matching cannot cross their boundaries while retaining surrounding text.
 */
function maskMarkdownCode(content: string) {
  const mask = (value: string) => " ".repeat(value.length);
  const withoutClosedFences = content.replace(/(```|~~~)[\s\S]*?\1/gu, mask);
  const withoutOpenFence = withoutClosedFences.replace(
    /(?:```|~~~)[\s\S]*$/gu,
    mask,
  );

  return maskInlineCodeSpans(withoutOpenFence);
}

function maskInlineCodeSpans(content: string) {
  const masked = content.split("");
  let start = 0;

  while (start < content.length) {
    const delimiterStart = content.indexOf("`", start);
    if (delimiterStart < 0) {
      break;
    }
    const delimiterLength = countBackticks(content, delimiterStart);
    let cursor = delimiterStart + delimiterLength;
    let delimiterEnd = -1;

    while (
      cursor < content.length &&
      content[cursor] !== "\n" &&
      content[cursor] !== "\r"
    ) {
      const candidateStart = content.indexOf("`", cursor);
      if (
        candidateStart < 0 ||
        content.slice(cursor, candidateStart).includes("\n") ||
        content.slice(cursor, candidateStart).includes("\r")
      ) {
        break;
      }
      const candidateLength = countBackticks(content, candidateStart);
      if (candidateLength === delimiterLength) {
        delimiterEnd = candidateStart + candidateLength;
        break;
      }
      cursor = candidateStart + candidateLength;
    }

    if (delimiterEnd < 0) {
      start = delimiterStart + delimiterLength;
      continue;
    }

    for (let index = delimiterStart; index < delimiterEnd; index += 1) {
      masked[index] = " ";
    }
    start = delimiterEnd;
  }

  return masked.join("");
}

function countBackticks(content: string, start: number) {
  let length = 0;
  while (content[start + length] === "`") {
    length += 1;
  }
  return length;
}
