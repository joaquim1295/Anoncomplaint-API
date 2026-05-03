import { cache } from "react";
import { getAppLocale, loadMessages } from "./server";
import type { Messages } from "./messages-type";
import type { AppLocale } from "./constants";

export const getI18n = cache(async (): Promise<{ locale: AppLocale; messages: Messages }> => {
  const locale = await getAppLocale();
  const messages = await loadMessages(locale);
  return { locale, messages };
});
