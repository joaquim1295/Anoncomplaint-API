"use server";

import { GROQ_TARGET_LANG, type AppLocale } from "@/lib/i18n/constants";

const MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function resolveTargetLang(targetLang: string): string {
  const t = String(targetLang ?? "").trim();
  if (!t) return GROQ_TARGET_LANG.pt;
  return t;
}

/**
 * Translates text with Groq. Never persisted — UI only.
 * On failure, rate limit, or missing key, returns the original text.
 */
export async function translateWithAI(text: string, targetLang: string): Promise<string> {
  const input = String(text ?? "").trim();
  if (!input) return "";

  const apiKey = process.env.GROQ_API_KEY ?? "";
  if (!apiKey) return input;

  const lang = resolveTargetLang(targetLang);
  const system =
    "You are a highly accurate, professional translator. " +
    `Translate the user's text into ${lang}. ` +
    "Respond ONLY with the translated text. Do not add conversational filler, notes, or explanations.";

  const slice = input.slice(0, 12000);
  const body = JSON.stringify({
    model: MODEL,
    temperature: 0.15,
    max_tokens: Math.min(4096, Math.ceil(slice.length / 3) + 400),
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: slice },
    ],
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const doFetch = async () =>
      fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body,
        cache: "no-store",
        signal: controller.signal,
      });

    let res = await doFetch();
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 800));
      res = await doFetch();
    }
    if (res.status === 429 || !res.ok) return input;

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const out = String(data?.choices?.[0]?.message?.content ?? "").trim();
    return out || input;
  } catch {
    return input;
  } finally {
    clearTimeout(timeout);
  }
}

/** Convenience: translate to the UI locale (pt / en / es). */
export async function translateForAppLocale(text: string, locale: AppLocale): Promise<string> {
  return translateWithAI(text, GROQ_TARGET_LANG[locale]);
}
