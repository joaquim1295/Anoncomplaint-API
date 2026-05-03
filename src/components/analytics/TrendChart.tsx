"use client";

import { useEffect, useState } from "react";
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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => {
      setIsDark(root.classList.contains("dark") || (!root.classList.contains("light") && media.matches));
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    media.addEventListener("change", syncTheme);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", syncTheme);
    };
  }, []);

  const grid = isDark ? "rgba(63,63,70,0.55)" : "rgba(113,113,122,0.28)";
  const axis = isDark ? "rgba(113,113,122,0.65)" : "rgba(82,82,91,0.62)";
  const tick = isDark ? "rgba(161,161,170,0.9)" : "rgba(82,82,91,0.9)";

  return (
    <div className="h-64 w-full rounded-2xl bg-zinc-50/90 p-4 ring-1 ring-inset ring-zinc-200/90 dark:bg-zinc-950/25 dark:ring-zinc-800/70">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke={grid} />
          <XAxis
            dataKey="date"
            stroke={axis}
            tick={{ fill: tick, fontSize: 12 }}
            tickFormatter={(v) => {
              const d = new Date(v);
              return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
            }}
          />
          <YAxis stroke={axis} tick={{ fill: tick, fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "rgba(9,9,11,0.9)" : "rgba(255,255,255,0.96)",
              border: isDark ? "1px solid rgba(63,63,70,0.75)" : "1px solid rgba(212,212,216,0.9)",
              borderRadius: "14px",
              color: isDark ? "rgb(244 244 245)" : "rgb(39 39 42)",
            }}
            labelStyle={{ color: isDark ? "rgba(161,161,170,0.95)" : "rgba(82,82,91,0.9)" }}
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
            stroke="var(--app-accent)"
            strokeWidth={2}
            dot={{ fill: "var(--app-accent)", strokeWidth: 0 }}
            activeDot={{ r: 4, fill: "var(--app-accent)", stroke: "rgb(9 9 11)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
