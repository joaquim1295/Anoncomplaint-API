import Link from "next/link";
import { BarChart3, BriefcaseBusiness, FileText, Hash, Home, Shield } from "lucide-react";
import { getResolvedAccountMode } from "../lib/accountMode";
import { UserRole } from "../types/user";
import { QuickComplaintLauncher } from "./QuickComplaintLauncher";
import { SideBarFooter } from "./SideBarFooter";
import { getI18n } from "../lib/i18n/request";
import { getMessage } from "../lib/i18n/dict";

const navClass =
  "group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-700 ring-cyber transition duration-200 ease-out hover:bg-zinc-200/85 hover:text-zinc-950 active:scale-[0.98] dark:text-zinc-200 dark:hover:bg-zinc-900/55 dark:hover:text-zinc-50";

export async function SideBar() {
  const ctx = await getResolvedAccountMode();
  const { messages } = await getI18n();
  const t = (path: string) => getMessage(messages, path);
  const user = ctx.user;
  const mode = ctx.user ? ctx.mode : "personal";

  return (
    <aside
      className="w-56 rounded-2xl border border-zinc-200/80 bg-white/90 p-3 shadow-lg shadow-zinc-900/[0.04] backdrop-blur-xl transition hover:bg-white dark:border-zinc-800/80 dark:bg-zinc-950/65 dark:shadow-none dark:hover:bg-zinc-950/80"
      suppressHydrationWarning
    >
      <div className="mb-2 px-2 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        {t("nav.section")}
      </div>
      <div className="flex flex-col gap-0.5">
        <Link href="/" className={navClass}>
          <Home className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
          <span>{t("nav.home")}</span>
        </Link>
        <Link href="/topicos" className={navClass}>
          <Hash className="h-4 w-4 text-violet-600 dark:text-violet-300/90" aria-hidden />
          <span>{t("nav.topics")}</span>
        </Link>
        <Link href="/analytics" className={navClass}>
          <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
          <span>{t("nav.stats")}</span>
        </Link>

        {user && ctx.canCompanyMode && mode === "company" ? (
          <Link href="/dashboard-empresa" className={navClass}>
            <BriefcaseBusiness className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
            <span>{t("nav.companyPanel")}</span>
          </Link>
        ) : null}

        {user?.role === UserRole.ADMIN && mode === "personal" ? (
          <Link href="/admin" className={navClass}>
            <Shield className="h-4 w-4 text-red-600 dark:text-red-300/90" aria-hidden />
            <span>{t("nav.adminPanel")}</span>
          </Link>
        ) : null}

        {user?.role === UserRole.ADMIN ? (
          <Link href="/relatorio" className={navClass}>
            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
            <span>{t("nav.techReport")}</span>
          </Link>
        ) : null}
        <Link href="/pesquisa" className={navClass}>
          <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
          <span>{t("nav.advancedSearch")}</span>
        </Link>
      </div>
      <QuickComplaintLauncher userLoggedIn={Boolean(user)} showTrigger={Boolean(user && mode === "personal")} />
      <SideBarFooter />
    </aside>
  );
}
