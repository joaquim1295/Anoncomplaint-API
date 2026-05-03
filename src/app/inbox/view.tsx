"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { formatDateTime } from "../../lib/formatDateTime";
import { cn } from "../../lib/utils";
import { getPusherClient } from "../../lib/realtime/pusher-client";
import { privateInboxChannel, privateUserChannel } from "../../lib/realtime/pusher-channels";
import { useI18n } from "../../components/providers/I18nProvider";
import { AiTranslateTextBlock } from "../../components/i18n/AiTranslateTextBlock";

type AccountMode = "personal" | "company";

type ConversationItem = {
  id: string;
  userId: string;
  companyId: string;
  side: "user" | "company";
  counterpartName: string;
  counterpartSubtitle?: string;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
};

type MessageItem = {
  id: string;
  conversationId: string;
  senderRole: "user" | "company";
  senderUserId: string;
  content: string;
  createdAt: string;
};

type Leitura = "todas" | "lidas" | "nao_lidas";

function parseLeitura(raw: string | null): Leitura {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "lidas" || v === "lida") return "lidas";
  if (v === "nao_lidas" || v === "nao-lidas" || v === "nao_lida") return "nao_lidas";
  return "todas";
}

function applyLeitura(list: ConversationItem[], leitura: Leitura): ConversationItem[] {
  if (leitura === "lidas") return list.filter((c) => c.unreadCount === 0);
  if (leitura === "nao_lidas") return list.filter((c) => c.unreadCount > 0);
  return list;
}

function stripLegacyInboxParams(sp: URLSearchParams) {
  sp.delete("contexto");
  sp.delete("company");
}

export function InboxView({
  accountMode,
  currentUserId,
  initialConversations,
  ownedCompanies,
}: {
  accountMode: AccountMode;
  currentUserId: string;
  initialConversations: ConversationItem[];
  ownedCompanies: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ownedIds = useMemo(() => new Set(ownedCompanies.map((c) => c.id)), [ownedCompanies]);

  const leitura = useMemo(() => parseLeitura(searchParams.get("leitura")), [searchParams]);
  const empresaParam = useMemo(() => {
    const e = searchParams.get("empresa")?.trim() ?? "";
    return e && ownedIds.has(e) ? e : null;
  }, [searchParams, ownedIds]);

  const [isPending, startTransition] = useTransition();
  const [conversations, setConversations] = useState<ConversationItem[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [composer, setComposer] = useState("");

  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  const scopedLive = useMemo(() => {
    if (accountMode === "personal") {
      return conversations.filter((c) => c.side === "user");
    }
    let list = conversations.filter((c) => c.side === "company" && ownedIds.has(c.companyId));
    if (empresaParam) list = list.filter((c) => c.companyId === empresaParam);
    return list;
  }, [accountMode, conversations, ownedIds, empresaParam]);

  const visibleConversations = useMemo(
    () => applyLeitura(scopedLive, leitura),
    [scopedLive, leitura]
  );

  const replaceQuery = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(searchParams.toString());
      stripLegacyInboxParams(sp);
      mutate(sp);
      const q = sp.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setLeitura = (value: Leitura) => {
    replaceQuery((sp) => {
      if (value === "todas") sp.delete("leitura");
      else sp.set("leitura", value === "lidas" ? "lidas" : "nao_lidas");
      const cur = sp.get("conversation")?.trim();
      const vis = applyLeitura(scopedLive, value);
      if (cur && !vis.some((c) => c.id === cur)) sp.delete("conversation");
    });
  };

  const setEmpresa = (value: string) => {
    if (accountMode !== "company") return;
    replaceQuery((sp) => {
      stripLegacyInboxParams(sp);
      if (!value || value === "todas") sp.delete("empresa");
      else sp.set("empresa", value);
      const cur = sp.get("conversation")?.trim();
      let list = conversations.filter((c) => c.side === "company" && ownedIds.has(c.companyId));
      if (value && value !== "todas") list = list.filter((c) => c.companyId === value);
      const vis = applyLeitura(list, leitura);
      if (cur && !vis.some((c) => c.id === cur)) sp.delete("conversation");
    });
  };

  useEffect(() => {
    const conv = searchParams.get("conversation")?.trim();
    if (conv && visibleConversations.some((c) => c.id === conv)) {
      setSelectedId(conv);
      return;
    }
    const first = visibleConversations[0]?.id ?? null;
    setSelectedId(first);
    if (conv) {
      replaceQuery((sp) => {
        if (first) sp.set("conversation", first);
        else sp.delete("conversation");
      });
    }
  }, [searchParams, visibleConversations, replaceQuery]);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const selectConversation = (id: string) => {
    setSelectedId(id);
    replaceQuery((sp) => {
      stripLegacyInboxParams(sp);
      sp.set("conversation", id);
    });
  };

  const resetFiltros = () => {
    replaceQuery((sp) => {
      stripLegacyInboxParams(sp);
      sp.delete("leitura");
      sp.delete("empresa");
      sp.delete("conversation");
    });
  };

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    setMessages([]);
    startTransition(async () => {
      const res = await fetch(`/api/v1/inbox/conversations/${selectedId}/messages`, {
        credentials: "include",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(json?.error?.message ?? t("inboxFilters.loadMessagesFailed"));
        return;
      }
      const items = (json?.data?.messages ?? []) as MessageItem[];
      setMessages(items);
      await fetch(`/api/v1/inbox/conversations/${selectedId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      setConversations((prev) => prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c)));
    });
  }, [selectedId]);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;
    const userChannel = pusher.subscribe(privateUserChannel(currentUserId));
    userChannel.bind("inbox:new-message", (data: { conversationId?: string; message?: MessageItem; from?: string }) => {
      const conversationId = String(data?.conversationId ?? "");
      if (!conversationId) return;

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversationId);
        if (!exists) {
          void (async () => {
            const res = await fetch("/api/v1/inbox/conversations", { credentials: "include" });
            const json = await res.json().catch(() => null);
            if (!res.ok) return;
            setConversations((json?.data ?? []) as ConversationItem[]);
          })();
          return prev;
        }
        return prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                unreadCount: c.id === selectedIdRef.current ? 0 : c.unreadCount + 1,
                lastMessage: data?.message?.content ?? c.lastMessage,
                lastMessageAt: data?.message?.createdAt ?? c.lastMessageAt,
              }
            : c
        );
      });

      if (selectedIdRef.current !== conversationId) {
        toast.message(t("inboxFilters.newMessageToast"), {
          description: data?.from ? `${t("inboxFilters.newMessageFromPrefix")}${data.from}` : undefined,
        });
      }
    });
    return () => {
      userChannel.unbind_all();
      pusher.unsubscribe(privateUserChannel(currentUserId));
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!selectedId) return;
    const pusher = getPusherClient();
    if (!pusher) return;
    const conversationChannel = pusher.subscribe(privateInboxChannel(selectedId));
    conversationChannel.bind(
      "inbox:new-message",
      (data: { conversationId?: string; message?: MessageItem }) => {
        const m = data?.message;
        if (!m || m.conversationId !== selectedId) return;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      }
    );
    return () => {
      conversationChannel.unbind_all();
      pusher.unsubscribe(privateInboxChannel(selectedId));
    };
  }, [selectedId]);

  function sendMessage() {
    if (!selectedId) return;
    const content = composer.trim();
    if (!content) return;
    startTransition(async () => {
      const res = await fetch(`/api/v1/inbox/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(json?.error?.message ?? t("inboxFilters.sendFailed"));
        return;
      }
      const sent = json?.data as MessageItem;
      setComposer("");
      setMessages((prev) => [...prev, sent]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId ? { ...c, lastMessage: sent.content, lastMessageAt: sent.createdAt } : c
        )
      );
    });
  }

  const modoLabel = accountMode === "personal" ? t("inboxFilters.modePersonal") : t("inboxFilters.modeCompany");
  const empresaSelectValue = empresaParam ?? "todas";

  const emptyHint =
    conversations.length === 0
      ? t("inboxFilters.emptyNoConversations")
      : scopedLive.length === 0
        ? accountMode === "personal"
          ? t("inboxFilters.emptyPersonal")
          : ownedCompanies.length === 0
            ? t("inboxFilters.emptyNoOwnedCompanies")
            : t("inboxFilters.emptyCompanyMode")
        : t("inboxFilters.emptyFiltered");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-3 dark:border-zinc-800/70 dark:bg-zinc-950/35">
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          {modoLabel}
          {t("inboxFilters.hintLine")}
          <strong className="text-zinc-700 dark:text-zinc-200">{t("inboxFilters.hintStrong")}</strong>
          {t("inboxFilters.hintTail")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          {accountMode === "company" && ownedCompanies.length > 0 ? (
            <label className="flex min-w-[200px] flex-1 flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {t("inboxFilters.company")}
              </span>
              <select
                value={empresaSelectValue}
                onChange={(e) => setEmpresa(e.target.value)}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100"
              >
                <option value="todas">{t("inboxFilters.allCompanies")}</option>
                {ownedCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 sm:max-w-xs">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {t("inboxFilters.reading")}
            </span>
            <select
              value={leitura}
              onChange={(e) => setLeitura(parseLeitura(e.target.value))}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100"
            >
              <option value="todas">{t("inboxFilters.readAll")}</option>
              <option value="lidas">{t("inboxFilters.readRead")}</option>
              <option value="nao_lidas">{t("inboxFilters.readUnread")}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
              {t("inboxFilters.conversationsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {conversations.length === 0 ? (
              <p className="rounded-xl border border-zinc-200/90 bg-zinc-50/80 px-3 py-3 text-sm text-zinc-600 dark:border-zinc-800/80 dark:bg-zinc-950/30 dark:text-zinc-400">
                Ainda não há conversas. Crie uma conversa ao contactar uma empresa.
              </p>
            ) : visibleConversations.length === 0 ? (
              <p className="rounded-xl border border-zinc-200/90 bg-zinc-50/80 px-3 py-3 text-sm text-zinc-600 dark:border-zinc-800/80 dark:bg-zinc-950/30 dark:text-zinc-400">
                {emptyHint}{" "}
                <button
                  type="button"
                  className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                  onClick={() => resetFiltros()}
                >
                  {t("inboxFilters.resetFilters")}
                </button>
              </p>
            ) : (
              visibleConversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={c.id === selectedId}
                  onClick={() => selectConversation(c.id)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-left transition",
                    c.id === selectedId
                      ? "border-emerald-500/50 bg-emerald-50/80 dark:bg-emerald-900/20"
                      : "border-zinc-200/90 bg-white/70 hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-950/25 dark:hover:bg-zinc-900/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{c.counterpartName}</p>
                    {c.unreadCount > 0 && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  {accountMode === "company" ? (
                    <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                      {ownedCompanies.find((x) => x.id === c.companyId)?.name ?? t("inbox.companyFallback")}
                    </p>
                  ) : null}
                  {c.counterpartSubtitle ? (
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{c.counterpartSubtitle}</p>
                  ) : null}
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">{c.lastMessage ?? t("inbox.noMessagesYet")}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-[420px] flex-col">
          <CardHeader className="pb-2">
            <CardTitle>{selected?.counterpartName ?? t("inbox.inbox")}</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 pt-0">
            <div className="min-h-[280px] flex-1 space-y-2 overflow-y-auto rounded-xl border border-zinc-200/90 bg-zinc-50/70 p-3 dark:border-zinc-800/80 dark:bg-zinc-950/25">
              {selected ? (
                messages.length === 0 ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("inbox.emptyThread")}</p>
                ) : (
                  messages.map((m) => {
                    const isOwn = m.senderUserId === currentUserId;
                    return (
                      <div key={m.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                            isOwn
                              ? "bg-emerald-600/15 text-zinc-900 dark:text-zinc-100"
                              : "bg-white text-zinc-900 ring-1 ring-zinc-200/90 dark:bg-zinc-900/50 dark:text-zinc-100 dark:ring-zinc-800/80"
                          )}
                        >
                          {isOwn ? (
                            <p className="whitespace-pre-wrap">{m.content}</p>
                          ) : (
                            <AiTranslateTextBlock text={m.content} paragraphClassName="whitespace-pre-wrap text-sm" />
                          )}
                          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                            {formatDateTime(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("inbox.pickConversation")}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={selected ? t("inbox.composerPlaceholder") : t("inbox.composerDisabled")}
                disabled={!selected || isPending}
              />
              <Button
                type="button"
                onClick={sendMessage}
                disabled={!selected || isPending || !composer.trim()}
                aria-label={t("inbox.sendMessage")}
              >
                <Send className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
