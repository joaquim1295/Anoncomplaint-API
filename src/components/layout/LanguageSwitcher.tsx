"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { NEXT_LOCALE_COOKIE, SUPPORTED_LOCALES, LOCALE_LABELS, type AppLocale } from "@/lib/i18n/constants";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ variant = "header" }: { variant?: "header" | "sidebar" }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [pending, startTransition] = useTransition();

  function onChange(next: AppLocale) {
    if (next === locale) return;
    startTransition(() => {
      document.cookie = `${NEXT_LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
      router.refresh();
    });
  }

  if (variant === "sidebar") {
    return (
      <div className="mt-2">
        <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t("theme.language")}
        </p>
        <label className="flex w-full items-center gap-2 rounded-xl border border-zinc-200/90 bg-white/90 px-3 py-2 text-xs font-medium text-zinc-800 shadow-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200">
          <Languages className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
          <select
            className={cn(
              "min-w-0 flex-1 cursor-pointer rounded-lg border border-zinc-200/80 bg-zinc-50 px-2 py-1.5 text-xs font-medium text-zinc-900 outline-none",
              "dark:border-zinc-500/80 dark:bg-zinc-800 dark:text-zinc-50 dark:[color-scheme:dark]",
              pending && "opacity-60"
            )}
            value={locale}
            disabled={pending}
            aria-label={t("theme.language")}
            onChange={(e) => onChange(e.target.value as AppLocale)}
          >
            {SUPPORTED_LOCALES.map((code) => (
              <option key={code} value={code}>
                {LOCALE_LABELS[code]}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  return (
    <label className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white/90 px-2 py-1.5 text-xs font-medium text-zinc-800 shadow-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200">
      <Languages className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
      <span className="hidden sm:inline text-zinc-500 dark:text-zinc-400">{t("theme.language")}</span>
      <select
        className={cn(
          "max-w-[9rem] cursor-pointer rounded-lg border border-zinc-200/80 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-900 outline-none",
          "dark:border-zinc-500/80 dark:bg-zinc-800 dark:text-zinc-50 dark:[color-scheme:dark]",
          pending && "opacity-60"
        )}
        value={locale}
        disabled={pending}
        aria-label={t("theme.language")}
        onChange={(e) => onChange(e.target.value as AppLocale)}
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
