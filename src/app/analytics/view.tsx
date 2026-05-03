"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Activity, Filter, MapPinned, X } from "lucide-react";

const TrendChart = dynamic(() => import("../../components/analytics/TrendChart").then((m) => m.TrendChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-zinc-200/50 dark:bg-zinc-800/50" aria-hidden />,
});
const RageMap = dynamic(() => import("../../components/complaints/RageMap").then((m) => m.RageMap), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-zinc-200/50 dark:bg-zinc-800/50" aria-hidden />,
});
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import type { WeeklyTrendItem } from "../../lib/complaintService";
import type { RageMapPoint } from "../../components/complaints/RageMap";
import type { ComplaintStatus } from "../../types/complaint";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/Dialog";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/layout/PageHeader";
import { useI18n } from "../../components/providers/I18nProvider";

export function AnalyticsView({
  trends,
  total,
  mapPoints = [],
  companyReputation,
  complaints,
}: {
  trends: WeeklyTrendItem[];
  total: number;
  mapPoints?: RageMapPoint[];
  companyReputation?: {
    avgResponseHours: number;
    solutionIndex: number;
    reputationRanking: {
      companyId: string;
      companyName: string;
      companySlug?: string | null;
      reputationScore: number;
      avgResponseHours: number;
      approvalRate: number;
    }[];
    mostAgile: { companyId: string; companyName: string; companySlug?: string | null; avgHours: number }[];
    mostCredible: { companyId: string; companyName: string; companySlug?: string | null; approvalRate: number }[];
    leastCredible: { companyId: string; companyName: string; companySlug?: string | null; approvalRate: number }[];
  };
  complaints: {
    id: string;
    title: string;
    status: ComplaintStatus;
    companyName: string | null;
    city: string | null;
    content: string;
    createdAtLabel?: string;
    attachments: string[];
  }[];
}) {
  const { t } = useI18n();
  const [showMap, setShowMap] = useState(true);
  const [showCompanyStats, setShowCompanyStats] = useState(true);
  const [showTrend, setShowTrend] = useState(true);
  const [companyFilter, setCompanyFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      const byCompany =
        !companyFilter.trim() ||
        (item.companyName ?? "").toLowerCase().includes(companyFilter.trim().toLowerCase());
      const byCity =
        !cityFilter.trim() ||
        (item.city ?? "").toLowerCase().includes(cityFilter.trim().toLowerCase());
      const byStatus = statusFilter === "all" || item.status === statusFilter;
      return byCompany && byCity && byStatus;
    });
  }, [complaints, companyFilter, cityFilter, statusFilter]);

  const selectedComplaint = useMemo(
    () => filteredComplaints.find((item) => item.id === selectedComplaintId) ?? null,
    [filteredComplaints, selectedComplaintId]
  );

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <PageHeader title={t("analytics.title")} iconName="barChart3" variant="sticky" />
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border border-zinc-300/90 bg-zinc-50/80 px-3 py-1.5 text-xs text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-900/45"
            onClick={() => setShowMap((v) => !v)}
          >
            {showMap ? t("analytics.hideMap") : t("analytics.showMap")}
          </button>
          <button
            type="button"
            className="rounded-xl border border-zinc-300/90 bg-zinc-50/80 px-3 py-1.5 text-xs text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-900/45"
            onClick={() => setShowCompanyStats((v) => !v)}
          >
            {showCompanyStats ? t("analytics.hideReputation") : t("analytics.showReputation")}
          </button>
          <button
            type="button"
            className="rounded-xl border border-zinc-300/90 bg-zinc-50/80 px-3 py-1.5 text-xs text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-900/45"
            onClick={() => setShowTrend((v) => !v)}
          >
            {showTrend ? t("analytics.hideTrend") : t("analytics.showTrend")}
          </button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <Filter className="h-4 w-4" />
              {t("analytics.filtersTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input placeholder={t("analytics.companyPlaceholder")} value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} />
              <Input placeholder={t("analytics.cityPlaceholder")} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
              <select
                className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200/90 dark:border-transparent dark:bg-zinc-950/30 dark:text-zinc-100 dark:ring-zinc-800/70"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">{t("common.status.all")}</option>
                <option value="pending">{t("common.status.pending")}</option>
                <option value="reviewed">{t("common.status.reviewed")}</option>
                <option value="resolved">{t("common.status.resolved")}</option>
                <option value="archived">{t("common.status.archived")}</option>
                <option value="pending_review">{t("common.status.pending_review")}</option>
              </select>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300/90 bg-zinc-50/80 px-3 text-sm text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-900/45"
                onClick={() => {
                  setCompanyFilter("");
                  setCityFilter("");
                  setStatusFilter("all");
                }}
              >
                <X className="h-4 w-4" />
                {t("common.clear")}
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-emerald-800 dark:text-emerald-200">{t("analytics.totalComplaints")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-100">{total}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{t("analytics.sinceStart")}</p>
              </CardContent>
            </Card>
            {showMap && (
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                  <MapPinned className="h-4 w-4 text-red-600 dark:text-red-300/90" aria-hidden />
                  <span>{t("analytics.complaintsMap")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{t("analytics.mapHint")}</p>
                <div className="h-64 overflow-hidden rounded-xl bg-zinc-100/90 ring-1 ring-inset ring-zinc-200/90 dark:bg-zinc-950/30 dark:ring-zinc-800/70">
                  <RageMap points={mapPoints} />
                </div>
              </CardContent>
              </Card>
            )}
          </div>
          {showTrend && (
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-emerald-800 dark:text-emerald-200">{t("analytics.last7days")}</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart data={trends} />
            </CardContent>
          </Card>
          )}

          {showCompanyStats && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-emerald-800 dark:text-emerald-200">{t("analytics.companyReputation")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-zinc-50/90 p-3 ring-1 ring-inset ring-zinc-200/90 dark:bg-zinc-950/20 dark:ring-zinc-800/70">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("analytics.agility")}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-100">
                    {companyReputation?.avgResponseHours?.toFixed(1) ?? "0.0"}h
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("analytics.avgResponseLabel")}</p>
                </div>
                <div className="rounded-xl bg-zinc-50/90 p-3 ring-1 ring-inset ring-zinc-200/90 dark:bg-zinc-950/20 dark:ring-zinc-800/70">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("analytics.credibility")}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-emerald-800 dark:text-emerald-200">
                    {companyReputation?.solutionIndex?.toFixed(1) ?? "0.0"}%
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("analytics.solutionIndexLabel")}</p>
                </div>
                <div className="rounded-xl bg-zinc-50/90 p-3 ring-1 ring-inset ring-zinc-200/90 dark:bg-zinc-950/20 dark:ring-zinc-800/70">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("analytics.ranking")}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {(companyReputation?.reputationRanking ?? []).slice(0, 4).map((item, idx) => (
                      <li key={item.companyId} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 flex-1 truncate text-zinc-800 dark:text-zinc-200">
                          {idx + 1}. {item.companyName}
                        </span>
                        <span className="tabular-nums text-emerald-700 dark:text-emerald-200">{item.reputationScore.toFixed(1)}</span>
                      </li>
                    ))}
                    {(companyReputation?.reputationRanking ?? []).length === 0 && (
                      <li className="text-sm text-zinc-600 dark:text-zinc-400">{t("common.noData")}</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-zinc-50/90 p-3 ring-1 ring-inset ring-zinc-200/90 dark:bg-zinc-950/20 dark:ring-zinc-800/70">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("home.mostAgile")}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {(companyReputation?.mostAgile ?? []).slice(0, 3).map((x) => (
                      <li key={x.companyId} className="flex items-center justify-between gap-2">
                        <span className="truncate text-zinc-800 dark:text-zinc-200">{x.companyName}</span>
                        <span className="tabular-nums text-emerald-700 dark:text-emerald-300">{x.avgHours.toFixed(1)}h</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-zinc-50/90 p-3 ring-1 ring-inset ring-zinc-200/90 dark:bg-zinc-950/20 dark:ring-zinc-800/70">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("home.mostTrusted")}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {(companyReputation?.mostCredible ?? []).slice(0, 3).map((x) => (
                      <li key={x.companyId} className="flex items-center justify-between gap-2">
                        <span className="truncate text-zinc-800 dark:text-zinc-200">{x.companyName}</span>
                        <span className="tabular-nums text-emerald-700 dark:text-emerald-300">{x.approvalRate.toFixed(0)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-zinc-50/90 p-3 ring-1 ring-inset ring-zinc-200/90 dark:bg-zinc-950/20 dark:ring-zinc-800/70">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("home.leastTrusted")}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {(companyReputation?.leastCredible ?? []).slice(0, 3).map((x) => (
                      <li key={x.companyId} className="flex items-center justify-between gap-2">
                        <span className="truncate text-zinc-800 dark:text-zinc-200">{x.companyName}</span>
                        <span className="tabular-nums text-amber-800 dark:text-amber-200">{x.approvalRate.toFixed(0)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          )}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <Activity className="h-4 w-4" />
              {t("analytics.drillDown")} ({filteredComplaints.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredComplaints.slice(0, 8).map((item) => (
                <Dialog key={item.id} open={selectedComplaintId === item.id} onOpenChange={(open) => setSelectedComplaintId(open ? item.id : null)}>
                  <DialogTrigger asChild>
                    <button
                      className="w-full rounded-xl bg-zinc-50/90 p-3 text-left ring-1 ring-inset ring-zinc-200/90 hover:bg-zinc-100/90 dark:bg-zinc-950/25 dark:ring-zinc-800/70 dark:hover:bg-zinc-900/50"
                      onClick={() => setSelectedComplaintId(item.id)}
                    >
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.title}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {item.companyName ?? t("common.noCompany")} - {item.city ?? t("common.noCity")} -{" "}
                        {(() => {
                          const key = `common.status.${item.status}`;
                          const label = t(key);
                          return label === key ? item.status : label;
                        })()}
                      </p>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{selectedComplaint?.title ?? t("common.complaintFallback")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {selectedComplaint?.companyName ?? t("common.noCompany")} - {selectedComplaint?.city ?? t("common.noCity")} -{" "}
                        {selectedComplaint?.status
                          ? (() => {
                              const key = `common.status.${selectedComplaint.status}`;
                              const label = t(key);
                              return label === key ? selectedComplaint.status : label;
                            })()
                          : "-"}{" "}
                        - {selectedComplaint?.createdAtLabel ?? "-"}
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-100">{selectedComplaint?.content}</p>
                      {(selectedComplaint?.attachments ?? []).length > 0 && (
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                          {(selectedComplaint?.attachments ?? []).map((img, idx) => (
                            <a key={`${selectedComplaint?.id}-a-${idx}`} href={img} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg ring-1 ring-zinc-800/80">
                              <img src={img} alt={`${t("common.attachment")} ${idx + 1}`} className="h-24 w-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                      <DialogClose className="rounded-lg border border-zinc-300/90 px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900/45">
                        {t("common.close")}
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
              {filteredComplaints.length === 0 && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("common.noMatches")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
