"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import type { AppLocale } from "@/lib/i18n/constants";
import type { Messages } from "@/lib/i18n/messages-type";
import { getMessage } from "@/lib/i18n/dict";

type I18nContextValue = {
  locale: AppLocale;
  t: (path: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: AppLocale;
  messages: Messages;
  children: ReactNode;
}) {
  const t = useCallback((path: string) => getMessage(messages, path), [messages]);
  const value = useMemo(() => ({ locale, t }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
