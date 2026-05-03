import Link from "next/link";
import { Suspense } from "react";
import { Activity } from "lucide-react";
import { SmartComplaintMark } from "../brand/SmartComplaintMark";
import { getResolvedAccountMode } from "../../lib/accountMode";
import { HomeSearchBar } from "../HomeSearchBar";
import { UserNav } from "../UserNav";
import { Skeleton } from "../ui/Skeleton";
import { AccountModeSwitcher } from "../account/AccountModeSwitcher";
import { getI18n } from "../../lib/i18n/request";
import { getMessage } from "../../lib/i18n/dict";

export async function SiteHeader() {
  const ctx = await getResolvedAccountMode();
  const user = ctx.user;
  const { messages } = await getI18n();
  const activitiesLabel = getMessage(messages, "header.activities");

  return (
    <header className="sticky top-0 z-30 min-w-0 shrink-0 rounded-t-3xl border-b border-zinc-200/90 bg-white/90 px-3 py-3 shadow-sm backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/55 dark:shadow-none md:px-5">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:gap-4">
        <Link
          href="/"
          className="inline-flex min-w-0 shrink-0 items-center gap-2 rounded-xl px-2 py-1.5 text-lg font-semibold tracking-tight text-zinc-900 ring-cyber transition hover:bg-zinc-100/90 dark:text-zinc-100 dark:hover:bg-zinc-900/40 sm:text-xl"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm dark:bg-emerald-400 dark:shadow-glow-emerald" aria-hidden />
          <SmartComplaintMark size="lg" />
        </Link>

        <div className="flex min-w-0 w-full flex-1 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3 md:flex-nowrap">
          <div className="min-w-0 w-full flex-1 sm:w-auto md:max-w-md md:flex-initial lg:max-w-lg">
            <Suspense fallback={<Skeleton className="h-10 w-full max-w-md" />}>
              <HomeSearchBar />
            </Suspense>
          </div>
          {user && ctx.mode === "personal" ? (
            <Link
              href="/activities"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-700 ring-cyber transition hover:bg-zinc-100 hover:text-zinc-900 sm:self-center dark:text-zinc-200 dark:hover:bg-zinc-900/45 dark:hover:text-zinc-100"
            >
              <Activity className="h-4 w-4 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
              <span className="hidden sm:inline">{activitiesLabel}</span>
            </Link>
          ) : null}
          {user && ctx.canCompanyMode ? (
            <AccountModeSwitcher initialMode={ctx.mode} canCompanyMode={ctx.canCompanyMode} />
          ) : null}
          <UserNav userId={user?.userId ?? null} userEmail={user?.email ?? null} />
        </div>
      </div>
    </header>
  );
}
