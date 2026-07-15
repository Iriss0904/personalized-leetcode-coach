import type { PublicHot150Problem } from "@/data/hot150/local-run-types";

export function ProblemStatement({ problem }: { problem: PublicHot150Problem }) {
  return (
    <section className="space-y-4" aria-label="Problem metadata">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {problem.section} · {problem.difficulty}
        </p>
        <h2 className="text-xl font-semibold">{problem.number}. {problem.title}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {problem.tags.map((tag) => (
          <span className="rounded-full border px-2 py-1 text-xs" key={tag}>{tag}</span>
        ))}
      </div>
      <div className="rounded-lg border bg-muted/30 p-3 text-sm">
        <p className="font-medium">Python signature</p>
        <code>
          {problem.signature.methodName}({problem.signature.parameters.map((item) => item.name).join(", ")})
        </code>
      </div>
      <p className="text-sm text-muted-foreground">
        PatternCoach does not bundle the official problem statement. Read it at the source, then return here to practice locally.
      </p>
      <a className="text-sm font-medium text-primary underline" href={problem.originalProblemUrl} rel="noreferrer" target="_blank">
        Open original problem on LeetCode
      </a>
    </section>
  );
}
