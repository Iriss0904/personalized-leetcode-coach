import { findOfficialAcceptanceOverclaims } from "./product-invariant-guard";

const maxReplyLength = 1800;

export function findForbiddenCopy(markdown: string): string[] {
  return [
    ...new Set(
      findOfficialAcceptanceOverclaims(markdown).map(
        (match) => match.patternId,
      ),
    ),
  ];
}

export function assertNoForbiddenCopy(markdown: string) {
  const matches = findForbiddenCopy(markdown);

  if (matches.length > 0) {
    throw new Error(`Coach reply contains forbidden copy: ${matches[0]}`);
  }
}

export type CoachReplyContractResult =
  | { valid: true }
  | { valid: false; errors: string[] };

// The learner-facing Review reply is free-form soft-beat markdown. The local
// contract enforces only safety and size, not fixed headings.
export function validateCoachReplyContract(
  markdown: string,
): CoachReplyContractResult {
  const errors: string[] = [];

  if (markdown.trim().length === 0) {
    errors.push("Coach reply is empty.");
  }

  errors.push(
    ...findForbiddenCopy(markdown).map(
      (pattern) => `Coach reply contains forbidden copy: ${pattern}`,
    ),
  );
  if (markdown.length > maxReplyLength) {
    errors.push("Coach reply is too long for the first-review contract.");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

export function assertCoachReplyContract(markdown: string) {
  const result = validateCoachReplyContract(markdown);

  if (!result.valid) {
    throw new Error(result.errors.join("\n"));
  }

  return result;
}

export type CoachReplyGuardResult = {
  reply: string;
  formatWarnings: string[];
  safetyReplaced: boolean;
};

// Review-path guard. Safety-boundary violations are replaced before display.
// Other contract problems are non-fatal and surfaced as warnings.
export function applyCoachReplyGuards(
  reply: string,
  options: { responseLanguage: "zh" | "en"; runStatus?: string },
): CoachReplyGuardResult {
  if (findForbiddenCopy(reply).length > 0) {
    return {
      reply: buildSafetyReplacementReply(
        options.responseLanguage,
        options.runStatus,
      ),
      formatWarnings: [],
      safetyReplaced: true,
    };
  }

  const contract = validateCoachReplyContract(reply);

  return {
    reply,
    formatWarnings: contract.valid ? [] : contract.errors,
    safetyReplaced: false,
  };
}

function buildSafetyReplacementReply(
  language: "zh" | "en",
  runStatus?: string,
): string {
  if (language === "zh") {
    return zhSafetyReplacementReply;
  }

  if (runStatus === "passed_visible_tests") {
    return buildPassedSafetyReplacementReply(language);
  }

  return [
    "I cannot determine from the current description alone that this code has officially passed.",
    "My judgment should be grounded first in local run evidence and explicit remote LeetCode run or judge results. When those tools are unavailable, I can use DeepSeek static reasoning only as an auxiliary check.",
    "For final confirmation, open the official LeetCode link on the left and verify it there.",
  ].join("\n");
}

function buildPassedSafetyReplacementReply(language: "zh" | "en"): string {
  if (language === "zh") {
    return zhSafetyReplacementReply;
  }

  return [
    "### Judge status",
    "The coach draft was withheld because it crossed a safety boundary: it sounded like an official-success promise.",
    "### Read-only review",
    "The run evidence above is the only ground truth for this attempt. Treat local visible-test results as limited evidence.",
    "### What to do next",
    "Run it through LeetCode's official judge for confirmation, then record your Today self-rating.",
  ].join("\n");
}

const zhSafetyReplacementReply =
  "我不能仅凭当前描述判断这份代码已经官方通过。我的判断会优先基于本地运行证据和明确的远程 LeetCode 运行/评测结果。当这些工具不可用时，我可以用 DeepSeek 做静态推理辅助判断。若你想最终确认，请点击左侧 LeetCode 官方链接自行提交校验。";
