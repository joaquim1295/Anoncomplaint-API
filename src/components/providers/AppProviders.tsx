"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import type { AppLocale } from "@/lib/i18n/constants";
import type { Messages } from "@/lib/i18n/messages-type";
import { I18nProvider } from "./I18nProvider";

export function AppProviders({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: AppLocale;
  messages: Messages;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="smartcomplaint-theme">
      <I18nProvider locale={locale} messages={messages}>
        {children}
      </I18nProvider>
    </ThemeProvider>
  );
}
