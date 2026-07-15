import { publicHot150Bank } from "@/data/hot150/local-bank.public";
export function findPracticeProblemChatTool(args: { query?: string }) {
  const query = (args.query ?? "").toLowerCase();
  const rows = publicHot150Bank.problems.filter((problem) => !query || problem.slug.includes(query) || problem.title.toLowerCase().includes(query) || String(problem.number) === query).slice(0, 5);
  return { tool: "find_practice_problem" as const, ok: true, message: `${rows.length} matches`, data: rows.map(({ number, slug, title, difficulty, tags }) => ({ number, slug, title, difficulty, tags })) };
}
