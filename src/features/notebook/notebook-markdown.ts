import type { ReviewProblemCard } from "@/server/planner/review-focus/review-focus.types";
import type { NotebookProblemGroup } from "./notebook-data";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function cardTitle(card: ReviewProblemCard) {
  return card.leetcodeNumber ? `${card.leetcodeNumber}. ${card.title}` : card.title;
}

function reviewHref(card: ReviewProblemCard) {
  const params = new URLSearchParams({ problem: card.slug });
  if (card.planItemId) {
    params.set("planItemId", card.planItemId);
  }
  return `/workbench?${params.toString()}`;
}

function outcomeLabel(card: ReviewProblemCard) {
  if (card.lastOutcome === "passed") return "通过";
  if (card.lastOutcome === "failed") return "失败";
  if (card.lastOutcome === "hesitated") return "磕绊";
  if (card.lastOutcome === "struggled") return "挣扎";
  if (card.lastOutcome === "unsolved") return "没解出";
  return "待观察";
}

function savedAtLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return formatDate(date);
}

function problemLines(card: ReviewProblemCard) {
  const lines = [
    "",
    `### ${cardTitle(card)}（${card.difficulty ?? "Unknown"} · 上次：${outcomeLabel(card)}）`,
  ];

  if (card.manualEntry) {
    const savedAt = savedAtLabel(card.manualEntry.lastSavedAt);
    lines.push(
      `- 手动收录：第 ${card.manualEntry.saveCount} 次${savedAt ? ` · ${savedAt}` : ""}`,
    );
    lines.push("");
    lines.push("#### 题目指南");
    lines.push("");
    lines.push(card.manualEntry.guideMarkdown);
  }

  if (card.trapSummary) {
    lines.push(
      card.manualEntry
        ? `- 复习重点：${card.trapSummary}`
        : `- 常错点：${card.trapSummary}`,
    );
  }

  if (card.dueDate) {
    lines.push(`- 到期：${card.dueDate}`);
  }

  lines.push(`- Review：${reviewHref(card)}`);

  if (card.flashcard) {
    lines.push(`- 自查问题：${card.flashcard.question}`);
    lines.push(`- 自查答案：${card.flashcard.answer}`);
  } else if (card.flashcardStatus === "can_generate") {
    lines.push("- 自查卡：已有诊断，待补生成");
  } else {
    lines.push("- 自查卡：这次诊断不完整，暂无自查卡");
  }

  return lines;
}

function groupLines(groups: NotebookProblemGroup[]) {
  if (groups.length === 0) {
    return ["", "_暂无待攻克题目。_"];
  }

  return groups.flatMap((group) => [
    "",
    `## ${group.tag}`,
    ...group.cards.flatMap(problemLines),
  ]);
}

function resolvedLines(cards: ReviewProblemCard[]) {
  if (cards.length === 0) {
    return ["", "_继续努力，攻克的题目会显示在这里。_"];
  }

  return cards.flatMap((card) => [
    "",
    `- ${cardTitle(card)}：${card.trapSummary ?? "已通过最近一次 Review"}`,
  ]);
}

export function buildNotebookMarkdown(args: {
  groups: NotebookProblemGroup[];
  resolved: ReviewProblemCard[];
  generatedAt: Date;
}) {
  const toFixCount = args.groups.reduce(
    (count, group) => count + group.cards.length,
    0,
  );

  return [
    "# 错题本",
    "",
    `> 生成于 ${formatDate(args.generatedAt)} · 待攻克 ${toFixCount} · 已攻克 ${args.resolved.length}`,
    "",
    "# 待攻克题目",
    ...groupLines(args.groups),
    "",
    "# 已攻克题目",
    ...resolvedLines(args.resolved),
    "",
  ].join("\n");
}
