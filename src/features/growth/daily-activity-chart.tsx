"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyActivityPoint } from "@/server/growth/growth-stats";

type Mode = "problems" | "minutes";

export function DailyActivityChart({ data }: { data: DailyActivityPoint[] }) {
  const [mode, setMode] = useState<Mode>("problems");
  const chartData = useMemo(
    () =>
      data.map((point) => ({
        date: point.date.slice(5),
        problems: point.problemCount,
        minutes: point.minutes,
      })),
    [data],
  );
  const dataKey = mode === "problems" ? "problems" : "minutes";
  const hasData = data.some((point) => point.problemCount > 0 || point.minutes > 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Daily Activity</h2>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </div>
        <div className="flex rounded-md border border-border bg-background p-0.5">
          <ModeButton active={mode === "problems"} onClick={() => setMode("problems")}>
            Problems
          </ModeButton>
          <ModeButton active={mode === "minutes"} onClick={() => setMode("minutes")}>
            Minutes
          </ModeButton>
        </div>
      </div>
      {hasData ? (
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickMargin={8} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey={dataKey} fill="#126a5a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyGrowthState />
      )}
    </div>
  );
}

function ModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={
        active
          ? "rounded px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground"
          : "rounded px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      }
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function EmptyGrowthState() {
  return (
    <div className="mt-4 flex h-56 items-center rounded-md border border-dashed border-border px-4 text-sm text-muted-foreground">
      Do one Review and your growth map will start filling in here.
    </div>
  );
}
