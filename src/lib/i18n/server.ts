import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isAppLocale, NEXT_LOCALE_COOKIE, type AppLocale } from "./constants";
import type { Messages } from "./messages-type";

export async function getAppLocale(): Promise<AppLocale> {
  const jar = await cookies();
  const raw = jar.get(NEXT_LOCALE_COOKIE)?.value;
  return isAppLocale(raw) ? raw : DEFAULT_LOCALE;
}

export async function loadMessages(locale: AppLocale): Promise<Messages> {
  switch (locale) {
    case "en":
      return (await import("@/messages/en.json")).default;
    case "es":
      return (await import("@/messages/es.json")).default;
    default:
      return (await import("@/messages/pt.json")).default;
  }
}
