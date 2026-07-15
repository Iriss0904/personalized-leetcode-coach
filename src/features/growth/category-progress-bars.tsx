import type { CategoryProgress } from "@/server/growth/growth-stats";

export function CategoryProgressBars({ data }: { data: CategoryProgress[] }) {
  const visible = data.filter((item) => item.total > 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold">Top150 Category Progress</h2>
        <p className="text-xs text-muted-foreground">Passed / practiced / total</p>
      </div>
      {visible.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {visible.map((item) => (
            <div className="grid gap-1.5" key={item.category}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium">{item.category}</span>
                <span className="text-muted-foreground">
                  {item.passed} / {item.attempted} / {item.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-amber-300" style={{ width: percent(item.attempted, item.total) }} />
                <div
                  className="-mt-2 h-full bg-primary"
                  style={{ width: percent(item.passed, item.total) }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
          Seed Hot-150 problems to see the category map.
        </div>
      )}
    </div>
  );
}

function percent(value: number, total: number) {
  if (total <= 0) {
    return "0%";
  }
  return `${Math.min(100, Math.round((value / total) * 100))}%`;
}
