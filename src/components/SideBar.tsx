"use client";

import Link from "next/link";
import { BarChart3, BriefcaseBusiness, FileText, Home } from "lucide-react";

export function SideBar() {
  return (
    <aside className="w-56 rounded-2xl bg-zinc-950/30 p-3 ring-1 ring-inset ring-zinc-800/70 backdrop-blur">
      <div className="mb-2 px-2 py-2 text-xs font-medium tracking-wider text-zinc-500">
        NAV
      </div>
      <div className="flex flex-col gap-1">
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-200 ring-cyber transition hover:bg-zinc-900/50 hover:text-zinc-100"
        >
          <Home className="h-4 w-4 text-emerald-300/90" aria-hidden />
          <span>Início</span>
        </Link>
        <Link
          href="/analytics"
          className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-200 ring-cyber transition hover:bg-zinc-900/50 hover:text-zinc-100"
        >
          <BarChart3 className="h-4 w-4 text-emerald-300/90" aria-hidden />
          <span>Dashboard Público</span>
        </Link>
        <Link
          href="/dashboard-empresa"
          className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-200 ring-cyber transition hover:bg-zinc-900/50 hover:text-zinc-100"
        >
          <BriefcaseBusiness className="h-4 w-4 text-emerald-300/90" aria-hidden />
          <span>Dashboard Empresa</span>
        </Link>
        <Link
          href="/relatorio"
          className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-200 ring-cyber transition hover:bg-zinc-900/50 hover:text-zinc-100"
        >
          <FileText className="h-4 w-4 text-emerald-300/90" aria-hidden />
          <span>Relatório Técnico</span>
        </Link>
      </div>
    </aside>
  );
}
