export const NEXT_LOCALE_COOKIE = "NEXT_LOCALE";

export const SUPPORTED_LOCALES = ["pt", "en", "es"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "pt";

export function isAppLocale(value: string | undefined): value is AppLocale {
  return value === "pt" || value === "en" || value === "es";
}

export const LOCALE_LABELS: Record<AppLocale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
};

/** Groq / prompt: full language name for the system message. */
export const GROQ_TARGET_LANG: Record<AppLocale, string> = {
  pt: "Portuguese (Portugal)",
  en: "English",
  es: "Spanish",
};
