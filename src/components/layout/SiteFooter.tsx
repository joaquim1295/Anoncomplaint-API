import { SmartComplaintMark } from "../brand/SmartComplaintMark";
import { getI18n } from "../../lib/i18n/request";
import { getMessage } from "../../lib/i18n/dict";

export async function SiteFooter() {
  const { messages } = await getI18n();
  const rights = getMessage(messages, "footer.rights");
  const disclaimer = getMessage(messages, "footer.disclaimer");
  return (
    <footer className="mt-auto shrink-0 border-t border-zinc-200/90 bg-zinc-50/85 px-4 py-5 dark:border-zinc-800/60 dark:bg-zinc-950/45 md:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 text-xs text-zinc-500 dark:text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex flex-wrap items-baseline gap-x-1">
          <span>© 2026</span>
          <SmartComplaintMark size="sm" variant="muted" className="inline" />
          <span>{rights}</span>
        </p>
        <p className="max-w-md leading-5">{disclaimer}</p>
      </div>
    </footer>
  );
}
