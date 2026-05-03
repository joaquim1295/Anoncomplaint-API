import type { Metadata } from "next";
import Link from "next/link";
import { Hash, Inbox, SearchX, TrendingUp } from "lucide-react";
import { getCurrentUser } from "../lib/getUser";
import * as complaintService from "../lib/complaintService";
import { ComplaintItem } from "../components/ComplaintItem";
import { RageMeter } from "../components/RageMeter";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { ComplaintFeed } from "../components/complaints/ComplaintFeed";
import * as analyticsService from "../lib/services/analytics";
import { LiveActivityFeed } from "../components/home/LiveActivityFeed";
import { getI18n } from "../lib/i18n/request";
import { getMessage } from "../lib/i18n/dict";

function slugifyCompanyName(name: string): string {
  return String(name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function empresaPublicHref(row: { companyName: string; companySlug?: string | null }) {
  const raw = (row.companySlug ?? "").trim();
  const slug = raw || slugifyCompanyName(row.companyName);
  return `/empresa/${encodeURIComponent(slug)}`;
}

const empresaNameLinkClass =
  "font-medium text-emerald-800 underline-offset-2 hover:text-emerald-950 hover:underline dark:text-emerald-200 dark:hover:text-emerald-50";

export const metadata: Metadata = {
  title: "Início",
  description: "Explora denúncias, empresas e tópicos em tempo real.",
};

type PageProps = { searchParams: Promise<{ q?: string; company?: string }> };

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = typeof params?.q === "string" ? params.q.trim() : undefined;
  const companyFilter = typeof params?.company === "string" ? params.company.trim() : undefined;

  const PAGE_SIZE = 10;

  const [{ messages }, user, feedResult, companyStats, topComplained, trendingTopics, companiesRage, recentInteractions] = await Promise.all([
    getI18n(),
    getCurrentUser(),
    q
      ? complaintService.searchComplaints(q, { limit: 30, companyId: companyFilter || undefined })
      : complaintService.getPublicFeedPaginated(1, PAGE_SIZE, { companyId: companyFilter || undefined }),
    analyticsService.getOverallCompanyStats(),
    analyticsService.getTopComplainedCompaniesLast72h(),
    analyticsService.getTrendingTopicsLast72h(),
    analyticsService.getCompaniesRageMeterLast72h(10),
    analyticsService.getRecentCompanyInteractions(),
  ]);
  const tr = (key: string) => getMessage(messages, key);
  function hashtagSearchHref(tag: string) {
    const qs = new URLSearchParams();
    qs.set("q", tag);
    if (companyFilter) qs.set("company", companyFilter);
    return `/?${qs.toString()}`;
  }
  const isSearch = Boolean(q);
  const searchResults = (isSearch ? feedResult : []) as Awaited<ReturnType<typeof complaintService.searchComplaints>>;
  const publicFeed = (!isSearch
    ? feedResult
    : { complaints: [], hasMore: false }) as Awaited<ReturnType<typeof complaintService.getPublicFeedPaginated>>;

  const liveActivityItems = recentInteractions.map((i) => ({
    complaintId: i.complaintId,
    companyName: i.companyName,
    content: i.text,
    createdAt: typeof i.createdAt === "string" ? i.createdAt : new Date(i.createdAt).toISOString(),
  }));

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 pt-2 lg:grid-cols-3">
          <main className="space-y-6 lg:col-span-2 lg:max-h-[calc(100vh-9.5rem)] lg:overflow-hidden">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
                  {tr("home.topCompanies72h")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {(() => {
                    const list = topComplained.slice(0, 5);
                    const max = Math.max(...list.map((i) => i.count), 1);
                    return list.map((item, idx) => {
                      const ratio = item.count / max;
                      const barClass =
                        ratio >= 0.66
                          ? "bg-red-500/90"
                          : ratio >= 0.33
                          ? "bg-amber-500/80"
                          : "bg-amber-500/50";
                      return (
                    <li key={`${item.companyId}-${idx}`} className="flex items-center justify-between gap-2">
                      <Link
                        href={empresaPublicHref(item)}
                        className={`min-w-[140px] max-w-[min(200px,55vw)] truncate ${empresaNameLinkClass} text-zinc-800 dark:text-zinc-200`}
                      >
                        {item.companyName}
                      </Link>
                      <span className="flex items-center gap-2">
                        <span className="hidden sm:inline text-xs tabular-nums text-red-600 dark:text-red-400">{item.count}</span>
                        <span className="flex h-2 w-[110px] overflow-hidden rounded-full bg-zinc-200/90 ring-1 ring-inset ring-zinc-300/80 dark:bg-zinc-900/40 dark:ring-zinc-800/70" aria-hidden>
                          <span className={`${barClass}`} style={{ width: `${Math.max(6, ratio * 100)}%` }} />
                        </span>
                      </span>
                    </li>
                      );
                    });
                  })()}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2">
                  <Hash className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                  {tr("home.hotTopics")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {trendingTopics.map((topic) => (
                    <Link
                      key={topic.tag}
                      href={hashtagSearchHref(topic.tag)}
                      className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-900 ring-1 ring-inset ring-emerald-200/90 transition hover:bg-emerald-100/90 hover:ring-emerald-300/80 dark:bg-zinc-900/70 dark:text-emerald-200 dark:ring-emerald-500/30 dark:hover:bg-zinc-800/80 dark:hover:ring-emerald-400/40"
                    >
                      {topic.tag}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="scrollbar-none lg:h-[calc(100%-13rem)] lg:overflow-y-auto">
            <h2 className="mb-4 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {q ? `Resultados para "${q}"` : "Denúncias recentes"}
            </h2>
            <div className="space-y-4">
              {(!isSearch && publicFeed.complaints.length === 0) ||
              (isSearch && searchResults.length === 0) ? (
                <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-6 dark:border-zinc-800/70 dark:bg-zinc-950/25">
                  <div className="flex items-center gap-3">
                    {q ? (
                      <SearchX className="h-5 w-5 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
                    ) : (
                      <Inbox className="h-5 w-5 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
                    )}
                    <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {q ? tr("home.emptySearch") : tr("home.emptyFeed")}
                    </p>
                  </div>
                </div>
              ) : isSearch ? (
                searchResults.map((c) => (
                  <ComplaintItem
                    key={c.id}
                    complaint={c}
                    currentUserId={user?.userId ?? null}
                    currentUserRole={user?.role ?? null}
                    isSubscribed={user?.subscribedComplaints?.includes(c.id)}
                  />
                ))
              ) : (
                <ComplaintFeed
                  initialComplaints={publicFeed.complaints}
                  initialHasMore={publicFeed.hasMore}
                  currentUserId={user?.userId ?? null}
                  currentUserRole={user?.role ?? null}
                  subscribedComplaintIds={user?.subscribedComplaints ?? []}
                  pageSize={PAGE_SIZE}
                  companyFilterId={companyFilter ?? null}
                />
              )}
            </div>
          </section>
          </main>
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-emerald-800 dark:text-emerald-200">{tr("home.companyStatsTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-100">
                      {companyStats.avgResponseHours.toFixed(1)}h
                    </p>
                    <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{tr("home.avgResponseTime")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold tracking-tight text-emerald-800 tabular-nums dark:text-emerald-200">
                      {companyStats.solutionIndex.toFixed(1)}%
                    </p>
                    <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{tr("home.solutionIndex")}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-2 text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
                    {tr("home.reputationRanking")}
                  </p>
                  <ul className="space-y-2 text-sm">
                    {companyStats.reputationRanking.map((item, idx) => (
                      <li key={item.companyId} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 flex-1 truncate text-zinc-800 dark:text-zinc-200">
                          {idx + 1}.{" "}
                          <Link href={empresaPublicHref(item)} className={`inline ${empresaNameLinkClass}`}>
                            {item.companyName}
                          </Link>
                        </span>
                        <span className="tabular-nums text-emerald-700 dark:text-emerald-200">
                          {item.reputationScore.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/90 p-3 dark:border-zinc-800/70 dark:bg-zinc-950/20 dark:ring-1 dark:ring-inset dark:ring-zinc-800/70">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">{tr("home.mostAgile")}</p>
                      <ul className="mt-2 space-y-1 text-xs">
                        {companyStats.mostAgile.slice(0, 2).map((x) => (
                          <li key={x.companyId} className="flex items-center justify-between gap-2">
                            <Link href={empresaPublicHref(x)} className={`min-w-0 flex-1 truncate ${empresaNameLinkClass} text-zinc-800 dark:text-zinc-200`}>
                              {x.companyName}
                            </Link>
                            <span className="tabular-nums text-emerald-700 dark:text-emerald-300">{x.avgHours.toFixed(1)}h</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/90 p-3 dark:border-zinc-800/70 dark:bg-zinc-950/20 dark:ring-1 dark:ring-inset dark:ring-zinc-800/70">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">{tr("home.mostTrusted")}</p>
                      <ul className="mt-2 space-y-1 text-xs">
                        {companyStats.mostCredible.slice(0, 2).map((x) => (
                          <li key={x.companyId} className="flex items-center justify-between gap-2">
                            <Link href={empresaPublicHref(x)} className={`min-w-0 flex-1 truncate ${empresaNameLinkClass} text-zinc-800 dark:text-zinc-200`}>
                              {x.companyName}
                            </Link>
                            <span className="tabular-nums text-emerald-700 dark:text-emerald-300">{x.approvalRate.toFixed(0)}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/90 p-3 dark:border-zinc-800/70 dark:bg-zinc-950/20 dark:ring-1 dark:ring-inset dark:ring-zinc-800/70">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">{tr("home.leastTrusted")}</p>
                      <ul className="mt-2 space-y-1 text-xs">
                        {companyStats.leastCredible.slice(0, 2).map((x) => (
                          <li key={x.companyId} className="flex items-center justify-between gap-2">
                            <Link href={empresaPublicHref(x)} className={`min-w-0 flex-1 truncate ${empresaNameLinkClass} text-zinc-800 dark:text-zinc-200`}>
                              {x.companyName}
                            </Link>
                            <span className="tabular-nums text-amber-700 dark:text-amber-200">{x.approvalRate.toFixed(0)}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <RageMeter
                items={trendingTopics.map((t) => ({
                  tag: t.tag,
                  count: t.count,
                  href: hashtagSearchHref(t.tag),
                }))}
                title={tr("home.rageTopicsTitle")}
                subtitle={tr("home.rageTopicsSubtitle")}
                emptyText={tr("home.rageTopicsEmpty")}
              />
              <RageMeter
                items={companiesRage.map((c) => ({
                  tag: c.companyName,
                  count: c.count,
                  href: empresaPublicHref(c),
                }))}
                title={tr("home.rageCompaniesTitle")}
                subtitle={tr("home.rageCompaniesSubtitle")}
                emptyText={tr("home.rageCompaniesEmpty")}
              />
            </div>
            <LiveActivityFeed initialItems={liveActivityItems} />
          </aside>
        </div>
      </div>
    </div>
  );
}
