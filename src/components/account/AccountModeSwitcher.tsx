"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Building2, User } from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../providers/I18nProvider";

export function AccountModeSwitcher({
  initialMode,
  canCompanyMode,
}: {
  initialMode: "personal" | "company";
  canCompanyMode: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!canCompanyMode) return null;

  async function setMode(mode: "personal" | "company") {
    startTransition(async () => {
      const res = await fetch("/api/v1/account/mode", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) return;
      router.refresh();
    });
  }

  const btn =
    "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold tracking-tight transition sm:px-3 sm:text-sm";

  return (
    <div
      className="inline-flex max-w-[min(220px,72vw)] shrink-0 rounded-xl border border-zinc-200/90 bg-zinc-50/90 p-0.5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/50 sm:max-w-none"
      role="group"
      aria-label={t("accountMode.ariaGroup")}
    >
      <button
        type="button"
        disabled={pending}
        aria-pressed={initialMode === "personal"}
        onClick={() => void setMode("personal")}
        className={cn(
          btn,
          initialMode === "personal"
            ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/90 dark:bg-zinc-900/80 dark:text-zinc-50 dark:ring-zinc-700/80"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        )}
      >
        <User className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
        <span className="truncate">{t("accountMode.personal")}</span>
      </button>
      <button
        type="button"
        disabled={pending}
        aria-pressed={initialMode === "company"}
        onClick={() => void setMode("company")}
        className={cn(
          btn,
          initialMode === "company"
            ? "bg-emerald-500/12 text-emerald-950 shadow-sm ring-1 ring-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-50 dark:ring-emerald-500/40"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        )}
      >
        <Building2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
        <span className="truncate">{t("accountMode.company")}</span>
      </button>
    </div>
  );
}
