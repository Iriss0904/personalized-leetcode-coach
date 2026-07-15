export type HandbookNote = {
  id: string;
  conceptKey: string;
  title: string;
  snippet: string;
  whenToUse: string;
  category: string;
  lookupCount: number;
};

const categoryLabels: Record<string, string> = {
  python_api: "Python API",
  algo_template: "算法模板",
  stdlib: "标准库",
  general: "通用",
};

export function categoryLabel(category: string) {
  return categoryLabels[category] ?? category;
}

export function buildHandbookMarkdown(notes: HandbookNote[], generatedAt: Date): string {
  const lines = [
    "# 我的知识手册",
    "",
    `> 生成于 ${formatDate(generatedAt)} · 共 ${notes.length} 条`,
    "",
  ];
  if (notes.length === 0) {
    lines.push("_手册还是空的_");
    return lines.join("\n");
  }

  for (const [category, group] of groupByCategory(notes)) {
    lines.push(`## ${categoryLabel(category)}`, "");
    for (const note of group) {
      lines.push(
        `### ${note.title}（查了 ${note.lookupCount} 次）`,
        "",
        "```",
        note.snippet,
        "```",
        `何时用：${note.whenToUse}`,
        "",
      );
    }
  }
  return lines.join("\n");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function groupByCategory(notes: HandbookNote[]) {
  const grouped = new Map<string, HandbookNote[]>();
  for (const note of notes) {
    grouped.set(note.category, [...(grouped.get(note.category) ?? []), note]);
  }
  return grouped;
}
