"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Building2,
  Inbox,
  LayoutDashboard,
  ListFilter,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import type { Company } from "../../types/company";
import type { ComplaintDisplay } from "../../types/complaint";
import type { InboxConversationItem } from "../../lib/services/inbox-service";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { buttonVariants } from "../ui/Button";
import { CompanyComplaintManager } from "./CompanyComplaintManager";
import { cn } from "../../lib/utils";
import { useI18n } from "../providers/I18nProvider";
import type { AppLocale } from "../../lib/i18n/constants";

function localeToBcp47(locale: AppLocale): string {
  if (locale === "pt") return "pt-PT";
  if (locale === "es") return "es-ES";
  return "en-US";
}

function complaintTouchesCompany(c: ComplaintDisplay, companyId: string): boolean {
  if (c.companyId === companyId) return true;
  if ((c.tags ?? []).includes(companyId)) return true;
  if ((c.officialResponses ?? []).some((r) => r.companyId === companyId)) return true;
  return false;
}

type TabKey = "overview" | "complaints" | "messages";

export function CompanyManagementPanel({
  companies,
  complaints,
  conversations,
}: {
  companies: Company[];
  complaints: ComplaintDisplay[];
  conversations: InboxConversationItem[];
}) {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<TabKey>("overview");
  const [companyScope, setCompanyScope] = useState<string>("all");

  const ownedIds = useMemo(() => new Set(companies.map((c) => c.id)), [companies]);

  const companySideConversations = useMemo(
    () => conversations.filter((c) => c.side === "company" && ownedIds.has(c.companyId)),
    [conversations, ownedIds]
  );

  const filteredComplaints = useMemo(() => {
    if (companyScope === "all" || companies.length <= 1) return complaints;
    return complaints.filter((c) => complaintTouchesCompany(c, companyScope));
  }, [complaints, companyScope, companies.length]);

  const stats = useMemo(() => {
    const open = complaints.filter((c) => c.status !== "resolved" && c.status !== "archived").length;
    const unread = companySideConversations.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0);
    return { total: complaints.length, open, unread, conv: companySideConversations.length };
  }, [complaints, companySideConversations]);

  const tabBtn = (key: TabKey, label: string, icon: ReactNode) => (
    <button
      type="button"
      key={key}
      onClick={() => setTab(key)}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight transition",
        tab === key
          ? "bg-emerald-500/15 text-emerald-900 ring-1 ring-emerald-500/35 dark:text-emerald-100 dark:ring-emerald-500/40"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-100"
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-2 dark:border-zinc-800/70 dark:bg-zinc-950/35">
        {tabBtn("overview", t("dashboard.tabOverview"), <LayoutDashboard className="h-4 w-4" aria-hidden />)}
        {tabBtn("complaints", t("dashboard.tabComplaints"), <ListFilter className="h-4 w-4" aria-hidden />)}
        {tabBtn("messages", t("dashboard.tabMessages"), <MessageCircle className="h-4 w-4" aria-hidden />)}
      </div>

      {companies.length > 1 && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
            <span>{t("dashboard.companyLabel")}</span>
            <select
              value={companyScope}
              onChange={(e) => setCompanyScope(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100"
            >
              <option value="all">{t("dashboard.allCompanies")}</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-zinc-200/90 bg-white/90 dark:border-zinc-800/80 dark:bg-zinc-950/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("dashboard.statCompanies")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{companies.length}</p>
            </CardContent>
          </Card>
          <Card className="border border-zinc-200/90 bg-white/90 dark:border-zinc-800/80 dark:bg-zinc-950/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("dashboard.statComplaintsScope")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{stats.total}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {stats.open} {t("dashboard.statActiveLine")}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-zinc-200/90 bg-white/90 dark:border-zinc-800/80 dark:bg-zinc-950/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("dashboard.statConversations")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{stats.conv}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {stats.unread} {t("dashboard.statUnreadLine")}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-zinc-200/90 bg-white/90 dark:border-zinc-800/80 dark:bg-zinc-950/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("dashboard.shortcuts")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link
                href="/inbox"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex justify-start")}
              >
                <Inbox className="h-4 w-4" aria-hidden />
                {t("dashboard.openInbox")}
              </Link>
              <Link href="/perfil" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex justify-start")}>
                {t("dashboard.profileData")}
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "complaints" && (
        <CompanyComplaintManager complaints={filteredComplaints} companies={companies} companyScope={companyScope} />
      )}

      {tab === "messages" && (
        <Card className="border border-zinc-200/90 bg-white/90 dark:border-zinc-800/80 dark:bg-zinc-950/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-zinc-900 dark:text-zinc-100">
              <Inbox className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
              {t("dashboard.messagesTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {companySideConversations.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("dashboard.emptyCompanyInbox")}</p>
            ) : (
              <ul className="divide-y divide-zinc-200/90 dark:divide-zinc-800/80">
                {companySideConversations
                  .filter((c) => companyScope === "all" || companyScope === c.companyId)
                  .map((c) => {
                  const company = companies.find((x) => x.id === c.companyId);
                  const href = `/inbox?conversation=${encodeURIComponent(c.id)}${company ? `&empresa=${encodeURIComponent(company.id)}` : ""}`;
                  return (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{c.counterpartName}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {company?.name ?? t("dashboard.companyLabel")} ·{" "}
                          {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString(localeToBcp47(locale)) : ""}
                        </p>
                        {c.lastMessage ? (
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">{c.lastMessage}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        {c.unreadCount > 0 ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                            {c.unreadCount} {t("dashboard.newBadge")}
                          </span>
                        ) : null}
                        <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex")}>
                          {t("dashboard.open")}
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "overview" && companies.length > 0 && (
        <Card className="border border-zinc-200/90 bg-white/90 dark:border-zinc-800/80 dark:bg-zinc-950/40">
          <CardHeader>
            <CardTitle className="text-base text-zinc-900 dark:text-zinc-100">{t("dashboard.yourCompanies")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {companies.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800/70 dark:bg-zinc-950/30">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{c.name}</span>
                  <Link href={`/empresa/${c.slug}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex")}>
                    {t("dashboard.publicPage")}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
