import { publicHot150Bank } from "@/data/hot150/local-bank.public";

export function getHot150ProblemBySlug(slug: string) {
  return publicHot150Bank.problems.find((problem) => problem.slug === slug) ?? null;
}

export function getHot150ProblemByNumber(number: number) {
  return publicHot150Bank.problems.find((problem) => problem.number === number) ?? null;
}

export function listHot150Problems() {
  return publicHot150Bank.problems;
}
