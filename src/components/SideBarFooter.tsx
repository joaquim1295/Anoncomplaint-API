"use client";

import { ThemeToggle } from "./theme/ThemeToggle";
import { LanguageSwitcher } from "./layout/LanguageSwitcher";
import { useI18n } from "./providers/I18nProvider";

export function SideBarFooter() {
  const { t } = useI18n();
  return (
    <div className="mt-4 border-t border-zinc-200/70 pt-3 dark:border-zinc-800/70">
      <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">{t("theme.appearance")}</p>
      <ThemeToggle className="w-full justify-start px-3" />
      <LanguageSwitcher variant="sidebar" />
    </div>
  );
}
