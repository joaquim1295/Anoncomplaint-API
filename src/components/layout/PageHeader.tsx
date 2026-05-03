"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  FileText,
  Hash,
  Inbox,
  MapPinned,
  Search,
  Shield,
} from "lucide-react";
import { useI18n } from "../providers/I18nProvider";

export type PageHeaderIconName =
  | "hash"
  | "search"
  | "mapPinned"
  | "shield"
  | "fileText"
  | "briefcaseBusiness"
  | "bell"
  | "activity"
  | "inbox"
  | "barChart3";

const HEADER_ICONS: Record<PageHeaderIconName, LucideIcon> = {
  hash: Hash,
  search: Search,
  mapPinned: MapPinned,
  shield: Shield,
  fileText: FileText,
  briefcaseBusiness: BriefcaseBusiness,
  bell: Bell,
  activity: Activity,
  inbox: Inbox,
  barChart3: BarChart3,
};

type PageHeaderVariant = "underline" | "sticky";
type PageHeaderTone = "default" | "admin";

export function PageHeader({
  title,
  iconName,
  backHref = "/",
  backLabel: backLabelProp,
  variant = "underline",
  tone = "default",
}: {
  title: string;
  /** Serializable icon id (safe from Server → Client Components). */
  iconName?: PageHeaderIconName;
  backHref?: string;
  backLabel?: string;
  variant?: PageHeaderVariant;
  tone?: PageHeaderTone;
}) {
  const { t } = useI18n();
  const backLabel = backLabelProp ?? t("common.pageBack");
  const Icon = iconName ? HEADER_ICONS[iconName] : undefined;

  const accent =
    tone === "admin"
      ? "text-red-600 dark:text-red-300/90"
      : "text-emerald-600 dark:text-emerald-300/90";

  const sticky =
    variant === "sticky"
      ? "sticky top-3 z-10 mb-6 rounded-2xl border border-zinc-200/90 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/45 dark:shadow-none"
      : "";

  const underline =
    variant === "underline"
      ? "mb-8 border-b border-zinc-200/90 pb-5 dark:border-zinc-800/70"
      : "";

  return (
    <header
      className={`flex min-w-0 w-full flex-wrap items-center justify-between gap-4 ${sticky} ${underline}`}
    >
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-700 ring-cyber transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-900/45 dark:hover:text-zinc-100"
      >
        <ArrowLeft className={`h-4 w-4 ${accent}`} aria-hidden />
        <span>{backLabel}</span>
      </Link>
      <h1 className="inline-flex min-w-0 max-w-full items-center gap-2 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {Icon ? <Icon className={`h-4 w-4 shrink-0 ${accent}`} aria-hidden /> : null}
        <span className="min-w-0 truncate">{title}</span>
      </h1>
    </header>
  );
}
