"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Hash, Zap } from "lucide-react";
import { cn } from "../lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";

const rageBarVariants = cva("h-5 rounded transition-all", {
  variants: {
    intensity: {
      low: "bg-amber-500/60 max-w-[33%]",
      medium: "bg-orange-500/80 max-w-[66%]",
      high: "bg-red-500 max-w-full",
    },
  },
  defaultVariants: {
    intensity: "low",
  },
});

export interface RageMeterItem {
  tag: string;
  count: number;
}

interface RageMeterProps {
  items: RageMeterItem[];
  maxItems?: number;
  title?: string;
  className?: string;
}

function getIntensity(count: number, maxCount: number): VariantProps<typeof rageBarVariants>["intensity"] {
  if (maxCount <= 0) return "low";
  const ratio = count / maxCount;
  if (ratio >= 0.66) return "high";
  if (ratio >= 0.33) return "medium";
  return "low";
}

export function RageMeter({
  items,
  maxItems = 20,
  title = "Rage Meter",
  className,
}: RageMeterProps) {
  const list = items.slice(0, maxItems);
  const maxCount = Math.max(...list.map((i) => i.count), 1);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-200">
          <Zap className="h-4 w-4 text-emerald-300/90" aria-hidden />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs leading-5 text-zinc-400">Tags mais usadas nas denúncias</p>
        <ul className="space-y-2">
          {list.length === 0 ? (
            <li className="flex items-center gap-2 rounded-xl bg-zinc-950/20 px-3 py-2 text-sm text-zinc-400 ring-1 ring-inset ring-zinc-800/70">
              <Hash className="h-4 w-4 text-emerald-300/80" aria-hidden />
              <span>Ainda não há tags.</span>
            </li>
          ) : (
            list.map(({ tag, count }) => (
              <li key={tag} className="flex items-center gap-3">
                <span className="w-28 truncate text-sm font-medium tracking-tight text-zinc-200">{tag}</span>
                <div className="min-w-0 flex-1 overflow-hidden rounded-lg bg-zinc-950/25 ring-1 ring-inset ring-zinc-800/70">
                  <div
                    className={cn(
                      rageBarVariants({
                        intensity: getIntensity(count, maxCount),
                      })
                    )}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500 tabular-nums">{count}</span>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
