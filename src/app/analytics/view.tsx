"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, MapPinned } from "lucide-react";
import { TrendChart } from "../../components/analytics/TrendChart";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import type { WeeklyTrendItem } from "../../lib/complaintService";
import { RageMap, type RageMapPoint } from "../../components/complaints/RageMap";

export function AnalyticsView({
  trends,
  total,
}: {
  trends: WeeklyTrendItem[];
  total: number;
  mapPoints?: RageMapPoint[];
}) {
  const mapPoints = arguments[0].mapPoints ?? [];
  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/70 pb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-xl font-semibold tracking-tight text-zinc-100 ring-cyber transition hover:bg-zinc-900/40"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-glow-emerald" aria-hidden />
            <span>AnonComplaint</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-200 ring-cyber transition hover:bg-zinc-900/45 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-300/90" aria-hidden />
            <span>Voltar</span>
          </Link>
        </header>
        <h1 className="mb-6 inline-flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-100">
          <BarChart3 className="h-4 w-4 text-emerald-300/90" aria-hidden />
          <span>Dashboard Público</span>
        </h1>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-emerald-200">Total de denúncias</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight text-zinc-100 tabular-nums">{total}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">desde o início</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-200">
                  <MapPinned className="h-4 w-4 text-red-300/90" aria-hidden />
                  <span>Mapa de denúncias</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-xs leading-5 text-zinc-400">
                  Visualização geográfica das denúncias com localização partilhada.
                </p>
                <div className="h-64 overflow-hidden rounded-xl bg-zinc-950/30 ring-1 ring-inset ring-zinc-800/70">
                  <RageMap points={mapPoints} />
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-emerald-200">Últimos 7 dias</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart data={trends} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
