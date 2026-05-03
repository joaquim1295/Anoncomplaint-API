"use client";

import { useState, type CSSProperties } from "react";
import { Globe, Loader2 } from "lucide-react";
import { translateForAppLocale } from "@/actions/translation";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Variant = "default" | "dark";

export function AiTranslateTextBlock({
  text,
  paragraphClassName,
  paragraphStyle,
  variant = "default",
}: {
  text: string;
  paragraphClassName?: string;
  paragraphStyle?: CSSProperties;
  variant?: Variant;
}) {
  const { locale, t } = useI18n();
  const trimmed = String(text ?? "").trim();
  const [cached, setCached] = useState<string | null>(null);
  const [view, setView] = useState<"original" | "translated">("original");
  const [pending, setPending] = useState(false);

  if (!trimmed) return null;

  const showingTranslated = view === "translated" && Boolean(cached);
  const display = showingTranslated && cached ? cached : text;

  async function onToggle() {
    if (pending) return;
    if (cached && view === "translated") {
      setView("original");
      return;
    }
    if (cached && view === "original") {
      setView("translated");
      return;
    }
    setPending(true);
    try {
      const out = await translateForAppLocale(trimmed, locale);
      setCached(out);
      setView("translated");
    } finally {
      setPending(false);
    }
  }

  const label = pending
    ? t("translation.translating")
    : view === "translated" && cached
      ? t("translation.viewOriginal")
      : cached
        ? t("translation.viewTranslation")
        : t("translation.translate");

  const btnSurface =
    variant === "dark"
      ? "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
      : "text-zinc-500 hover:bg-zinc-100/90 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50";

  return (
    <div className="flex items-start gap-2">
      <p style={paragraphStyle} className={cn("min-w-0 flex-1", paragraphClassName)}>
        {display}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        title={label}
        aria-label={label}
        disabled={pending}
        onClick={() => void onToggle()}
        className={cn("h-8 w-8 shrink-0 rounded-lg p-0", btnSurface)}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin opacity-90" aria-hidden />
        ) : (
          <Globe className="h-4 w-4 opacity-90" aria-hidden />
        )}
      </Button>
    </div>
  );
}
