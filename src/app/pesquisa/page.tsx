import type { Metadata } from "next";
import { PageHeader } from "../../components/layout/PageHeader";
import { ComplaintItem } from "../../components/ComplaintItem";
import { getCurrentUser } from "../../lib/getUser";
import * as complaintService from "../../lib/complaintService";
import { getI18n } from "../../lib/i18n/request";
import { getMessage } from "../../lib/i18n/dict";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getI18n();
  return {
    title: getMessage(messages, "meta.pages.search.title"),
    description: getMessage(messages, "meta.pages.search.description"),
  };
}

type PageProps = {
  searchParams: Promise<{
    q?: string;
    company?: string;
    status?: string;
    city?: string;
    run?: string;
  }>;
};

export default async function PesquisaPage({ searchParams }: PageProps) {
  const [params, { messages }, user] = await Promise.all([searchParams, getI18n(), getCurrentUser()]);
  const run = params.run === "1";
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const company = typeof params.company === "string" ? params.company.trim() : "";
  const status = typeof params.status === "string" ? params.status.trim() : "";
  const city = typeof params.city === "string" ? params.city.trim().toLowerCase() : "";

  const tr = (key: string) => getMessage(messages, key);

  let filtered: Awaited<ReturnType<typeof complaintService.getFeed>> = [];
  if (run) {
    const initial = q
      ? await complaintService.searchComplaints(q, { limit: 100, companyId: company || undefined })
      : await complaintService.getFeed({ limit: 100, companyId: company || undefined });
    filtered = initial.filter((c) => {
      if (status && c.status !== status) return false;
      if (city && (c.location?.city ?? "").toLowerCase().indexOf(city) === -1) return false;
      return true;
    });
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <PageHeader title={tr("pesquisa.title")} iconName="search" variant="sticky" />

        <form
          method="GET"
          className="mb-8 grid gap-3 rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/25 dark:shadow-none sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{tr("pesquisa.labelText")}</span>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder={tr("pesquisa.placeholderText")}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{tr("pesquisa.labelCompany")}</span>
            <input
              type="text"
              name="company"
              defaultValue={company}
              placeholder={tr("pesquisa.placeholderCompany")}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{tr("pesquisa.labelStatus")}</span>
            <input
              type="text"
              name="status"
              defaultValue={status}
              placeholder={tr("pesquisa.placeholderStatus")}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{tr("pesquisa.labelCity")}</span>
            <input
              type="text"
              name="city"
              defaultValue={city}
              placeholder={tr("pesquisa.placeholderCity")}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </label>
          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-2">
            <button
              type="submit"
              name="run"
              value="1"
              className="h-10 rounded-xl border border-emerald-500/50 bg-emerald-500/15 px-4 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-500/25 dark:text-emerald-100 dark:hover:bg-emerald-500/25"
            >
              {tr("pesquisa.submit")}
            </button>
          </div>
        </form>

        {!run ? (
          <div className="rounded-2xl border border-dashed border-zinc-300/90 bg-zinc-50/60 p-8 text-center text-sm leading-6 text-zinc-600 dark:border-zinc-700/80 dark:bg-zinc-950/20 dark:text-zinc-400">
            <p className="font-medium text-zinc-800 dark:text-zinc-200">{tr("pesquisa.emptyTitle")}</p>
            <p className="mt-2">
              {tr("pesquisa.emptyHintBefore")}{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">{tr("pesquisa.submit")}</strong> {tr("pesquisa.emptyHintAfter")}
            </p>
          </div>
        ) : (
          <section className="space-y-4">
            {filtered.map((c) => (
              <ComplaintItem
                key={c.id}
                complaint={c}
                currentUserId={user?.userId ?? null}
                currentUserRole={user?.role ?? null}
                isSubscribed={Boolean(user?.subscribedComplaints?.includes(c.id))}
              />
            ))}
            {filtered.length === 0 && (
              <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-6 text-sm text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-950/30 dark:text-zinc-400">
                {tr("pesquisa.noResults")}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
