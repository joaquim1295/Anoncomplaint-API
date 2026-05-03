"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { useI18n } from "../providers/I18nProvider";
import { cn } from "../../lib/utils";

type TopicComment = {
  id: string;
  authorUserId: string;
  authorLabel: string;
  content: string;
  createdAt: string;
};

const PAGE_LIMIT = 15;

export function TopicComplaintCommentsAccordion({
  complaintId,
  topicSlug,
  currentUserId,
  initialOpen,
}: {
  complaintId: string;
  topicSlug: string;
  currentUserId: string | null;
  /** Abre a sanfona (ex.: link «Comentar» do feed com ?openComments=id). */
  initialOpen?: boolean;
}) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(Boolean(initialOpen));
  const [items, setItems] = useState<TopicComment[]>([]);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [draft, setDraft] = useState("");
  const [loadPending, startLoad] = useTransition();
  const [postPending, startPost] = useTransition();
  const dateLocale = locale === "en" ? "en-GB" : locale === "es" ? "es" : "pt-PT";

  const baseUrl = `/api/v1/topics/${encodeURIComponent(topicSlug)}/complaints/${encodeURIComponent(complaintId)}/comments`;

  const fetchInitial = useCallback(() => {
    startLoad(async () => {
      const res = await fetch(`${baseUrl}?limit=${PAGE_LIMIT}`, { credentials: "include" });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(payload?.error?.message ?? t("topicThread.loadError"));
        return;
      }
      const list = (payload?.data ?? []) as TopicComment[];
      setItems(list);
      setHasOlder(Boolean(payload?.meta?.hasOlder));
      setLoadedOnce(true);
    });
  }, [baseUrl, t]);

  useEffect(() => {
    if (!initialOpen) return;
    setOpen(true);
    if (!loadedOnce) fetchInitial();
  }, [initialOpen, loadedOnce, fetchInitial]);

  useEffect(() => {
    if (!initialOpen || !open) return;
    const tid = window.setTimeout(() => {
      document.getElementById(`topic-complaint-${complaintId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(tid);
  }, [initialOpen, open, complaintId, items.length]);

  function onToggle() {
    const next = !open;
    setOpen(next);
    if (next && !loadedOnce) fetchInitial();
  }

  function loadOlder() {
    if (items.length === 0) return;
    const oldest = items[0]!;
    startLoad(async () => {
      const res = await fetch(`${baseUrl}?limit=${PAGE_LIMIT}&before=${encodeURIComponent(oldest.createdAt)}`, {
        credentials: "include",
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(payload?.error?.message ?? t("topicThread.loadError"));
        return;
      }
      const older = (payload?.data ?? []) as TopicComment[];
      setItems((prev) => [...older, ...prev]);
      setHasOlder(Boolean(payload?.meta?.hasOlder));
    });
  }

  function submitComment() {
    const text = draft.trim();
    if (!text || !currentUserId) return;
    startPost(async () => {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: text }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(payload?.error?.message ?? t("topicThread.postError"));
        return;
      }
      const row = payload?.data as TopicComment | undefined;
      setDraft("");
      if (row?.id) {
        setItems((prev) => [...prev, row]);
      } else {
        fetchInitial();
      }
    });
  }

  const fullHref = `/reclamacao/${complaintId}?fromTopic=${encodeURIComponent(topicSlug)}`;

  return (
    <div
      className={cn(
        "border-x border-b border-zinc-200/80 bg-zinc-50/40 dark:border-zinc-800/80 dark:bg-zinc-950/30",
        "rounded-b-2xl"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-medium text-zinc-800 transition hover:bg-zinc-100/80 dark:text-zinc-200 dark:hover:bg-zinc-900/50"
      >
        <span className="inline-flex items-center gap-2">
          <MessageSquare className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
          {open ? t("topicThread.closeDiscussion") : t("topicThread.comment")}
        </span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 opacity-70" aria-hidden /> : <ChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />}
      </button>

      {open && (
        <div className="space-y-3 border-t border-zinc-200/80 px-4 pb-4 pt-3 dark:border-zinc-800/70">
          {loadPending && items.length === 0 ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-400" aria-hidden />
            </div>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-y-auto rounded-xl bg-white/80 p-2 ring-1 ring-zinc-200/80 dark:bg-zinc-950/40 dark:ring-zinc-800/70">
              {items.length === 0 ? (
                <li className="px-2 py-3 text-center text-xs text-zinc-500 dark:text-zinc-400">{t("topicThread.empty")}</li>
              ) : (
                items.map((m) => (
                  <li key={m.id} className="rounded-lg border border-zinc-100/90 px-2.5 py-2 text-xs dark:border-zinc-800/60">
                    <p className="font-medium text-zinc-800 dark:text-zinc-100">
                      {m.authorLabel}
                      <span className="ml-2 font-normal tabular-nums text-zinc-400 dark:text-zinc-500">
                        {new Date(m.createdAt).toLocaleString(dateLocale, { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{m.content}</p>
                  </li>
                ))
              )}
            </ul>
          )}

          {hasOlder ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-xs"
              disabled={loadPending}
              onClick={loadOlder}
            >
              {loadPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {t("topicThread.loadOlder")}
            </Button>
          ) : null}

          {currentUserId ? (
            <div className="space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                maxLength={600}
                placeholder={t("topicThread.placeholder")}
                className="min-h-[4rem] resize-none text-sm"
              />
              <Button type="button" size="sm" className="rounded-xl" disabled={postPending || !draft.trim()} onClick={submitComment}>
                {postPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {t("topicThread.send")}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              <Link href={`/login?from=${encodeURIComponent(`/t/${topicSlug}`)}`} className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400">
                {t("topicThread.loginToComment")}
              </Link>
            </p>
          )}

          <div className="pt-1">
            <Link
              href={fullHref}
              className="inline-flex text-xs font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
            >
              {t("topicThread.openFullPage")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
