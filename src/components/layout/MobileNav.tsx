"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  FileText,
  Hash,
  Home,
  LogIn,
  Menu,
  Search,
  Shield,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { ThemeToggle } from "../theme/ThemeToggle";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { AccountModeSwitcher } from "../account/AccountModeSwitcher";
import { useI18n } from "../providers/I18nProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

type MePayload = {
  accountMode?: "personal" | "company";
  canCompanyMode?: boolean;
  role?: string;
};

export function MobileNav() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [me, setMe] = useState<MePayload | false | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (cancelled) return;
        if (!res.ok) {
          setMe(false);
          return;
        }
        const json = (await res.json().catch(() => null)) as { data?: MePayload } | null;
        setMe(json?.data ?? false);
      } catch {
        if (!cancelled) setMe(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signedIn = me !== null && me !== false;
  const mode = signedIn && me.accountMode === "company" ? "company" : "personal";
  const canCompany = Boolean(signedIn && me.canCompanyMode);
  const isAdmin = Boolean(signedIn && me.role === "admin");

  const dockBtn =
    "flex h-11 w-11 items-center justify-center rounded-xl text-zinc-600 transition active:scale-95 hover:bg-zinc-200/90 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100";

  return (
    <div
      className={cn(
        "fixed left-1/2 z-40 flex max-w-[min(100vw-1rem,26rem)] -translate-x-1/2 items-center gap-1 rounded-2xl border border-zinc-200/90 bg-white/90 px-2 py-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl md:hidden dark:border-zinc-800/90 dark:bg-zinc-950/85 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
        "bottom-[max(0.75rem,calc(env(safe-area-inset-bottom,0px)+0.5rem))]"
      )}
      role="navigation"
      aria-label={t("a11y.mobileNav")}
    >
      <Link href="/" className={dockBtn} aria-label={t("nav.homeDock")}>
        <Home className="h-5 w-5" />
      </Link>
      <Link href="/topicos" className={dockBtn} aria-label={t("nav.topicsDock")}>
        <Hash className="h-5 w-5" />
      </Link>
      <Link href="/analytics" className={dockBtn} aria-label={t("nav.statsDock")}>
        <BarChart3 className="h-5 w-5" />
      </Link>
      <ThemeToggle compact className="h-11 w-11 border-0 hover:bg-zinc-200/90 dark:hover:bg-zinc-800/80" />
      <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Dialog.Trigger asChild>
          <button type="button" className={dockBtn} aria-label={t("mobile.moreOptions")}>
            <Menu className="h-5 w-5" />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
          <Dialog.Content className="fixed bottom-24 left-1/2 z-50 w-[min(92vw,20rem)] max-h-[min(70vh,28rem)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xl animate-in fade-in duration-200 dark:border-zinc-800/90 dark:bg-zinc-950">
            <Dialog.Title className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t("mobile.navigateTitle")}</Dialog.Title>
            {signedIn && canCompany ? (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t("mobile.accountSection")}</p>
                <AccountModeSwitcher initialMode={mode} canCompanyMode={canCompany} />
              </div>
            ) : null}
            <nav className="flex flex-col gap-1">
              {signedIn && canCompany && mode === "company" ? (
                <MobileMoreLink
                  href="/dashboard-empresa"
                  icon={<BriefcaseBusiness className="h-4 w-4" />}
                  label={t("nav.companyPanel")}
                  onNavigate={() => setMenuOpen(false)}
                />
              ) : null}
              {signedIn && isAdmin && mode === "personal" ? (
                <MobileMoreLink href="/admin" icon={<Shield className="h-4 w-4" />} label={t("nav.adminPanel")} onNavigate={() => setMenuOpen(false)} />
              ) : null}
              {signedIn && isAdmin ? (
                <MobileMoreLink
                  href="/relatorio"
                  icon={<FileText className="h-4 w-4" />}
                  label={t("mobile.techReportMenu")}
                  onNavigate={() => setMenuOpen(false)}
                />
              ) : null}
              <MobileMoreLink href="/pesquisa" icon={<Search className="h-4 w-4" />} label={t("mobile.advancedSearchMenu")} onNavigate={() => setMenuOpen(false)} />
              {me === false && (
                <MobileMoreLink href="/login" icon={<LogIn className="h-4 w-4" />} label={t("mobile.signIn")} onNavigate={() => setMenuOpen(false)} />
              )}
            </nav>
            <div className="mt-4 border-t border-zinc-200/80 pt-4 dark:border-zinc-800/80">
              <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("theme.appearance")}</p>
              <ThemeToggle className="w-full justify-start rounded-xl border-0 px-3 hover:bg-zinc-100 dark:hover:bg-zinc-900/70" />
              <LanguageSwitcher variant="sidebar" />
            </div>
            <Dialog.Close asChild>
              <Button type="button" variant="outline" size="sm" className="mt-4 w-full rounded-xl">
                {t("mobile.close")}
              </Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function MobileMoreLink({
  href,
  icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900/70"
    >
      <span className="text-emerald-600 dark:text-emerald-300/90">{icon}</span>
      {label}
    </Link>
  );
}
