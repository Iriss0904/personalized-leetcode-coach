"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AttemptsToFirstAcPoint } from "@/server/growth/growth-stats";

export function AttemptsToAcChart({
  data,
}: {
  data: AttemptsToFirstAcPoint[];
}) {
  const chartData = data.map((point) => ({
    date: point.firstAcDate.slice(5),
    attempts: point.attemptsToAc,
    title: point.problemTitle,
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold">First AC Attempts</h2>
        <p className="text-xs text-muted-foreground">Lower is better</p>
      </div>
      {chartData.length > 0 ? (
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickMargin={8} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              <Tooltip />
              <Line
                dataKey="attempts"
                dot={{ r: 3 }}
                stroke="#3b82f6"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4 flex h-56 items-center rounded-md border border-dashed border-border px-4 text-sm text-muted-foreground">
          Your first-pass trend appears after a passed Review.
        </div>
      )}
    </div>
  );
}
