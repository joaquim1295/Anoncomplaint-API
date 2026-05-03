"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { useI18n } from "../providers/I18nProvider";

type ThemeToggleProps = {
  className?: string;
  /** Compact icon-only (e.g. mobile dock). */
  compact?: boolean;
};

export function ThemeToggle({ className, compact }: ThemeToggleProps) {
  const { t } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size={compact ? "icon" : "sm"}
        className={cn("rounded-xl", className)}
        aria-label={t("theme.themeLabel")}
        disabled
      >
        <Sun className="h-4 w-4 opacity-40" aria-hidden />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon" : "sm"}
      className={cn(
        "rounded-xl border border-transparent hover:border-zinc-300/80 hover:bg-zinc-100/90 dark:hover:border-zinc-700/80 dark:hover:bg-zinc-900/50",
        compact ? "h-10 w-10 shrink-0" : "gap-2",
        className
      )}
      onClick={toggle}
      title={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
      aria-label={isDark ? t("theme.activateLight") : t("theme.activateDark")}
    >
      {isDark ? <Moon className="h-4 w-4 text-amber-200/90" aria-hidden /> : <Sun className="h-4 w-4 text-amber-600" aria-hidden />}
      {!compact && (
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{isDark ? t("theme.dark") : t("theme.light")}</span>
      )}
    </Button>
  );
}
