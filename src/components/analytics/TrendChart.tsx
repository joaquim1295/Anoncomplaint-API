"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WeeklyTrendItem } from "../../lib/complaintService";

export function TrendChart({ data }: { data: WeeklyTrendItem[] }) {
  return (
    <div className="h-64 w-full rounded-2xl bg-zinc-950/25 p-4 ring-1 ring-inset ring-zinc-800/70">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(63,63,70,0.55)" />
          <XAxis
            dataKey="date"
            stroke="rgba(113,113,122,0.65)"
            tick={{ fill: "rgba(161,161,170,0.9)", fontSize: 12 }}
            tickFormatter={(v) => {
              const d = new Date(v);
              return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
            }}
          />
          <YAxis stroke="rgba(113,113,122,0.65)" tick={{ fill: "rgba(161,161,170,0.9)", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(9,9,11,0.9)",
              border: "1px solid rgba(63,63,70,0.75)",
              borderRadius: "14px",
              color: "rgb(244 244 245)",
            }}
            labelStyle={{ color: "rgba(161,161,170,0.95)" }}
            formatter={(value: number) => [value, "Denúncias"]}
            labelFormatter={(label) =>
              new Date(label).toLocaleDateString("pt-PT", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            }
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--anon-accent)"
            strokeWidth={2}
            dot={{ fill: "var(--anon-accent)", strokeWidth: 0 }}
            activeDot={{ r: 4, fill: "var(--anon-accent)", stroke: "rgb(9 9 11)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
