import Link from "next/link";
import { Suspense } from "react";
import { Activity, Inbox, SearchX } from "lucide-react";
import { getCurrentUser } from "../lib/getUser";
import * as complaintService from "../lib/complaintService";
import { UserNav } from "../components/UserNav";
import { HomeSearchBar } from "../components/HomeSearchBar";
import { RageMeter } from "../components/RageMeter";
import { ComplaintItem } from "../components/ComplaintItem";
import { ComplaintForm } from "../components/ComplaintForm";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { ComplaintFeed } from "../components/complaints/ComplaintFeed";

type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = typeof params?.q === "string" ? params.q.trim() : undefined;

  const PAGE_SIZE = 10;

  const [user, feedResult, stats] = await Promise.all([
    getCurrentUser(),
    q
      ? complaintService.searchComplaints(q, { limit: 30 })
      : complaintService.getPublicFeedPaginated(1, PAGE_SIZE),
    complaintService.getStats(),
  ]);
  const isSearch = Boolean(q);
  const searchResults = (isSearch ? feedResult : []) as Awaited<ReturnType<typeof complaintService.searchComplaints>>;
  const publicFeed = (!isSearch
    ? feedResult
    : { complaints: [], hasMore: false }) as Awaited<ReturnType<typeof complaintService.getPublicFeedPaginated>>;

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
          <div className="flex items-center gap-3">
            <Suspense fallback={<Skeleton className="h-10 w-72" />}>
              <HomeSearchBar />
            </Suspense>
            {user && (
              <Link
                href="/activities"
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-200 ring-cyber transition hover:bg-zinc-900/45 hover:text-zinc-100"
              >
                <Activity className="h-4 w-4 text-emerald-300/90" aria-hidden />
                <span className="hidden sm:inline">Actividades</span>
              </Link>
            )}
            <UserNav userId={user?.userId ?? null} userEmail={user?.email ?? null} />
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-3">
          <main className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-4 text-base font-semibold tracking-tight text-zinc-100">
              {q ? `Resultados para "${q}"` : "Denúncias recentes"}
            </h2>
            <div className="space-y-4">
              {(!isSearch && publicFeed.complaints.length === 0) ||
              (isSearch && searchResults.length === 0) ? (
                <div className="rounded-2xl bg-zinc-950/25 p-6 ring-1 ring-inset ring-zinc-800/70">
                  <div className="flex items-center gap-3">
                    {q ? (
                      <SearchX className="h-5 w-5 text-emerald-300/90" aria-hidden />
                    ) : (
                      <Inbox className="h-5 w-5 text-emerald-300/90" aria-hidden />
                    )}
                    <p className="text-sm leading-6 text-zinc-300">
                      {q ? "Nenhuma denúncia encontrada." : "Ainda não há denúncias."}
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
                />
              )}
            </div>
          </section>
          </main>
          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-emerald-200">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight text-zinc-100 tabular-nums">{stats.total}</p>
                <p className="text-sm leading-6 text-zinc-400">total de denúncias</p>
                {stats.by_status.length > 0 && (
                  <ul className="mt-3 space-y-2 text-sm">
                    {stats.by_status.map((s) => (
                      <li key={s.status} className="flex items-center justify-between gap-3">
                        <span className="capitalize text-zinc-400">{s.status}</span>
                        <span className="tabular-nums text-zinc-200">{s.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <RageMeter
              items={stats.by_tag.map((t) => ({ tag: t.tag, count: t.count }))}
              title="Rage Meter"
            />
            {user && (
              <section>
                <ComplaintForm />
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
