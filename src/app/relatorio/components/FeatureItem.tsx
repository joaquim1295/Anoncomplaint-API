"use client";

import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";

interface FeatureItemProps {
  icon: ReactNode;
  title: string;
  desc: string;
  content: string;
}

export function FeatureItem({ icon, title, desc, content }: FeatureItemProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.8)]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-red-500/5" />
      <div className="relative flex items-start gap-3">
        <div className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-950/70 ring-1 ring-inset ring-zinc-700/80")}>
          {icon}
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold tracking-tight text-zinc-100">{title}</h3>
          <p className="text-xs leading-5 text-zinc-400">{desc}</p>
        </div>
      </div>
      <p className="relative mt-3 text-xs leading-5 text-zinc-300">{content}</p>
    </div>
  );
}

