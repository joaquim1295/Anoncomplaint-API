"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import {
  Bell,
  BellRing,
  Building2,
  Brain,
  Calendar,
  Flame,
  Loader2,
  MapPin,
  MessageSquare,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Tag,
  User2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import type { ComplaintDisplay } from "../types/complaint";
import { ComplaintStatus } from "../types/complaint";
import { UserRole } from "../types/user";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";
import { AiContextModal } from "./complaints/AiContextModal";
import { ComplaintCompanyResponseForm } from "./complaints/ComplaintCompanyResponseForm";
import { useI18n } from "./providers/I18nProvider";
import { AiTranslateTextBlock } from "./i18n/AiTranslateTextBlock";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
  {
    variants: {
      status: {
        [ComplaintStatus.PENDING]:
          "border border-amber-300/80 bg-amber-100 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-300",
        [ComplaintStatus.PENDING_REVIEW]:
          "border border-amber-300/80 bg-amber-100 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-300",
        [ComplaintStatus.REVIEWED]:
          "border border-blue-300/80 bg-blue-50 text-blue-900 dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-300",
        [ComplaintStatus.RESOLVED]:
          "border border-emerald-300/80 bg-emerald-50 text-emerald-900 dark:border-green-500/40 dark:bg-green-500/20 dark:text-green-300",
        [ComplaintStatus.ARCHIVED]:
          "border border-zinc-300/80 bg-zinc-100 text-zinc-700 dark:border-gray-500/40 dark:bg-gray-500/20 dark:text-gray-300",
      },
    },
    defaultVariants: {
      status: ComplaintStatus.PENDING,
    },
  }
);

export interface ComplaintItemProps {
  complaint: ComplaintDisplay;
  actions?: React.ReactNode;
  className?: string;
  currentUserId?: string | null;
  currentUserRole?: string | null;
  isSubscribed?: boolean;
  /** Em /t/[slug]: inclui ?fromTopic= na página da denúncia (voltar ao tópico). */
  returnTopicSlug?: string | null;
}

type CompanyOption = {
  id: string;
  name: string;
};

function slugifyName(name: string): string {
  return String(name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ComplaintItem({
  complaint,
  actions,
  className,
  currentUserId,
  currentUserRole,
  isSubscribed: isSubscribedInitial,
  returnTopicSlug,
}: ComplaintItemProps) {
  const router = useRouter();
  const { t, locale: appLocale } = useI18n();
  const displayAuthorLabel =
    complaint.author_label === "Autor registado" ? t("complaintCard.registeredAuthor") : complaint.author_label;
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [officialResponseContent, setOfficialResponseContent] = useState("");
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyParentByResponse, setReplyParentByResponse] = useState<Record<string, string | null>>({});
  const [endorsePending, startEndorseTransition] = useTransition();
  const [replyPending, startReplyTransition] = useTransition();
  const [subscriptionPending, startSubscriptionTransition] = useTransition();
  const [summaryPending, startSummaryTransition] = useTransition();
  const [actionError, setActionError] = useState<string | undefined>(undefined);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(Boolean(isSubscribedInitial));
  const endorsedBy = complaint.endorsedBy ?? [];
  const initialEndorseCount = endorsedBy.length;
  const initialHasEndorsed = currentUserId != null && endorsedBy.includes(currentUserId);
  const [endorseCount, setEndorseCount] = useState<number>(initialEndorseCount);
  const [hasEndorsed, setHasEndorsed] = useState<boolean>(initialHasEndorsed);
  const [aiSummary, setAiSummary] = useState<string | null>(complaint.ai_summary ?? null);
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [accountMode, setAccountMode] = useState<"personal" | "company">("personal");
  const dateLocaleTag = appLocale === "en" ? "en-GB" : appLocale === "es" ? "es" : "pt-PT";
  const reclamacaoHref =
    returnTopicSlug && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(returnTopicSlug.trim().toLowerCase())
      ? `/reclamacao/${complaint.id}?fromTopic=${encodeURIComponent(returnTopicSlug.trim().toLowerCase())}`
      : `/reclamacao/${complaint.id}`;
  const dateLabel =
    complaint.created_at_label ??
    new Date(complaint.created_at).toLocaleDateString(dateLocaleTag, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const editedAtRaw = complaint.edited_at ? new Date(complaint.edited_at as unknown as string | Date) : null;
  const editedAtLabel =
    editedAtRaw && !Number.isNaN(editedAtRaw.getTime())
      ? editedAtRaw.toLocaleString(dateLocaleTag, {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
  const isCompanyRole = currentUserRole === UserRole.COMPANY;
  const isAdmin = currentUserRole === UserRole.ADMIN;
  const hasCompanyTargetByOwner =
    currentUserId != null && (complaint.officialResponses ?? []).some((r) => r.companyOwnerUserId === currentUserId);
  const hasCompanyTargetByTag =
    isCompanyRole &&
    (complaint.tags ?? []).some((tag) => companyOptions.some((co) => String(co.id) === String(tag)));
  const canRespondAsCompany =
    accountMode === "company" && (isAdmin || (isCompanyRole && (hasCompanyTargetByOwner || hasCompanyTargetByTag)));
  const canReplyToResponse =
    currentUserId != null && (isAdmin || (currentUserRole === UserRole.USER && complaint.author_id === currentUserId));
  const hasLocation = Boolean(complaint.location && complaint.location.city);
  const canSubscribe = Boolean(currentUserId);
  const canShowAuthorProfile = complaint.author_label !== "Anónimo" && Boolean(complaint.author_id);
  const complaintCompanyHref =
    complaint.companySlug ? `/empresa/${complaint.companySlug}` : complaint.companyName ? `/empresa/${slugifyName(complaint.companyName)}` : null;
  const topicSlugRaw = (complaint.topic_slug ?? "").trim().toLowerCase();
  const showCommentInTopicCta =
    Boolean(topicSlugRaw) && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(topicSlugRaw) && !returnTopicSlug;
  const commentInTopicHref = showCommentInTopicCta
    ? `/t/${encodeURIComponent(topicSlugRaw)}?openComments=${encodeURIComponent(complaint.id)}`
    : null;
  const lineClampStyle = {
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  } as React.CSSProperties;

  useEffect(() => {
    setEndorseCount(initialEndorseCount);
    setHasEndorsed(initialHasEndorsed);
    setIsSubscribed(Boolean(isSubscribedInitial));
    setAiSummary(complaint.ai_summary ?? null);
    setAiSummaryOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaint.id, currentUserId, initialEndorseCount, initialHasEndorsed, isSubscribedInitial, complaint.ai_summary]);

  useEffect(() => {
    if (!currentUserId) return;
    void (async () => {
      const res = await fetch("/api/v1/account/mode", { credentials: "include" });
      const payload = await res.json().catch(() => null);
      const m = payload?.data?.mode;
      if (m === "company" || m === "personal") setAccountMode(m);
    })();
  }, [currentUserId]);

  useEffect(() => {
    if (!isCompanyRole && !isAdmin) return;
    void (async () => {
      const response = await fetch("/api/v1/company/companies", {
        credentials: "include",
      });
      const result = await response.json().catch(() => null);
      const companies = Array.isArray(result?.data) ? result.data : [];
      setCompanyOptions(companies);
      if (companies.length > 0) {
        setSelectedCompanyId(companies[0].id);
      }
    })();
  }, [isCompanyRole, isAdmin]);

  function onToggleSubscription() {
    if (!currentUserId) {
      toast.error(t("complaintCard.toastSubscribeLogin"));
      return;
    }
    const nextSubscribed = !isSubscribed;
    setIsSubscribed(nextSubscribed);
    startSubscriptionTransition(async () => {
      const response = await fetch(`/api/v1/subscriptions/${complaint.id}/toggle`, {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json().catch(() => null);
      const subscribed = result?.data?.subscribed;
      if (!response.ok || typeof subscribed !== "boolean") {
        setIsSubscribed(!nextSubscribed);
        toast.error(result?.error?.message ?? t("complaintCard.toastSubscriptionError"));
        return;
      }
      if (subscribed) {
        toast.success(t("complaintCard.toastSubscribed"));
      } else {
        toast.success(t("complaintCard.toastUnsubscribed"));
      }
      setIsSubscribed(subscribed);
    });
  }

  function onToggleEndorsement() {
    if (!currentUserId) return;
    setActionError(undefined);
    const nextHasEndorsed = !hasEndorsed;
    const nextCount = Math.max(0, endorseCount + (nextHasEndorsed ? 1 : -1));
    setHasEndorsed(nextHasEndorsed);
    setEndorseCount(nextCount);
    startEndorseTransition(async () => {
      const response = await fetch(`/api/v1/complaints/${complaint.id}/endorse`, {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setHasEndorsed(!nextHasEndorsed);
        setEndorseCount(endorseCount);
        const msg = result?.error?.message ?? t("complaintCard.toastEndorseError");
        setActionError(msg);
        toast.error(msg);
        return;
      }
      const endorsed = Boolean(result?.data?.endorsed);
      const endorsementsCount = typeof result?.data?.endorsementsCount === "number" ? result.data.endorsementsCount : endorseCount;
      setHasEndorsed(endorsed);
      setEndorseCount(Math.max(0, endorsementsCount));
      router.refresh();
    });
  }

  function onToggleAiSummary() {
    if (summaryPending) return;
    if (aiSummary) {
      setAiSummaryOpen((open) => !open);
      return;
    }
    setActionError(undefined);
    startSummaryTransition(async () => {
      const response = await fetch(`/api/v1/complaints/${complaint.id}/ai-summary`, {
        method: "POST",
        credentials: "include",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error?.message ?? t("complaintCard.toastSummaryError"));
        setActionError(payload?.error?.message ?? t("complaintCard.toastSummaryError"));
        return;
      }
      const next = payload?.data?.ai_summary ?? payload?.data?.aiSummary ?? payload?.ai_summary ?? null;
      setAiSummary(next);
      if (next) setAiSummaryOpen(true);
      if (next) toast.success(t("complaintCard.toastSummaryOk"));
    });
  }

  function onSubmitOfficialResponse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(undefined);
    startReplyTransition(async () => {
      const response = await fetch(`/api/v1/company/complaints/${complaint.id}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ companyId: selectedCompanyId, content: officialResponseContent }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(result?.error?.message ?? t("complaintCard.toastOfficialError"));
        return;
      }
      setOfficialResponseContent("");
      setShowResponseForm(false);
      router.refresh();
    });
  }

  function onSubmitReply(responseId: string) {
    if (!currentUserId) {
      toast.error(t("complaintCard.toastReplyLogin"));
      return;
    }
    const content = (replyDrafts[responseId] ?? "").trim();
    if (!content) return;
    startReplyTransition(async () => {
      const response = await fetch(`/api/v1/complaints/${complaint.id}/responses/${responseId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content,
          parentReplyId: replyParentByResponse[responseId] ?? undefined,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(result?.error?.message ?? t("complaintCard.toastReplyError"));
        return;
      }
      setReplyDrafts((prev) => ({ ...prev, [responseId]: "" }));
      setReplyParentByResponse((prev) => ({ ...prev, [responseId]: null }));
      router.refresh();
    });
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <h3 className="mb-3 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {complaint.title || t("complaintCard.noTitle")}
        </h3>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100/90 px-2 py-1 ring-1 ring-inset ring-zinc-300/80 dark:bg-zinc-950/30 dark:ring-zinc-800/70">
            <Calendar className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300/80" aria-hidden />
            <span className="tabular-nums">{dateLabel}</span>
          </span>
          <span className={cn(statusBadgeVariants({ status: complaint.status }))}>{complaint.status}</span>
          {editedAtLabel && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-100/90 px-2 py-1 font-medium text-amber-950 ring-1 ring-inset ring-amber-300/70 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-100 dark:ring-amber-500/30"
              title={editedAtLabel}
            >
              <PencilLine className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              {t("complaintCard.editedBadge")}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100/90 px-2 py-1 ring-1 ring-inset ring-zinc-300/80 dark:bg-zinc-950/30 dark:ring-zinc-800/70">
            <User2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300/70" aria-hidden />
            {canShowAuthorProfile ? (
              <Link href={`/u/${complaint.author_id}`} className="truncate max-w-[180px] underline-offset-2 hover:underline">
                {displayAuthorLabel}
              </Link>
            ) : (
              <span className="truncate max-w-[180px]">{displayAuthorLabel}</span>
            )}
          </span>
          {complaintCompanyHref && complaint.companyName && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100/90 px-2 py-1 ring-1 ring-inset ring-zinc-300/80 dark:bg-zinc-950/30 dark:ring-zinc-800/70">
              <Building2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300/70" aria-hidden />
              <Link href={complaintCompanyHref} className="truncate max-w-[180px] underline-offset-2 hover:underline">
                {complaint.companyName}
              </Link>
            </span>
          )}
          {hasLocation && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100/90 px-2 py-1 ring-1 ring-inset ring-zinc-300/80 dark:bg-zinc-950/30 dark:ring-zinc-800/70">
              <MapPin className="h-3.5 w-3.5 text-red-600 dark:text-red-300/80" aria-hidden />
              <span className="truncate max-w-[160px]">{complaint.location?.city}</span>
            </span>
          )}
          {complaint.topic_slug && (
            <Link
              href={`/t/${complaint.topic_slug}`}
              className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-1 text-xs font-medium text-violet-900 ring-1 ring-inset ring-violet-300/80 hover:bg-violet-200/80 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/35 dark:hover:bg-violet-500/25"
            >
              <Tag className="h-3.5 w-3.5 opacity-80" aria-hidden />
              <span className="font-mono">/{complaint.topic_slug}</span>
            </Link>
          )}
        </div>
        <div className="mb-4">
          <AiTranslateTextBlock
            text={complaint.content}
            paragraphStyle={lineClampStyle}
            paragraphClassName="whitespace-pre-wrap text-sm leading-6 text-zinc-800 dark:text-zinc-100"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-xl px-3 text-xs"
              onClick={onToggleAiSummary}
              disabled={summaryPending}
            >
              {summaryPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-700 dark:text-emerald-300/90" aria-hidden />
              ) : (
                <Sparkles className="h-4 w-4 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
              )}
              <span className="hidden sm:inline">{t("complaintCard.aiSummary")}</span>
              <span className="sm:hidden">{t("complaintCard.aiSummaryShort")}</span>
            </Button>

            <Link
              href={reclamacaoHref}
              className="inline-flex h-9 items-center rounded-xl border border-zinc-300/90 bg-white/80 px-3 text-xs font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900/60"
            >
              {t("complaintCard.readDetails")}
            </Link>
          </div>

          {aiSummaryOpen && (
            <div className="mt-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 dark:border-transparent dark:bg-zinc-950/25 dark:ring-1 dark:ring-inset dark:ring-emerald-500/20">
              <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-800 dark:text-zinc-100">
                {aiSummary || t("complaintCard.aiSummaryUnavailable")}
              </p>
            </div>
          )}
          {(complaint.attachments ?? []).length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              {(complaint.attachments ?? []).map((img, idx) => (
                <a key={`${complaint.id}-att-${idx}`} href={img} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg ring-1 ring-zinc-300/90 dark:ring-zinc-800/80">
                  <img src={img} alt={`${t("complaintCard.attachmentAlt")} ${idx + 1}`} className="h-24 w-full object-cover transition hover:scale-[1.03]" />
                </a>
              ))}
            </div>
          )}
        </div>
        {(complaint.officialResponses ?? []).map((officialResponse) => (
          <div key={officialResponse.id} className="mb-4 rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-4 dark:border-transparent dark:bg-zinc-950/25 dark:ring-1 dark:ring-inset dark:ring-emerald-500/20">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-200">
              <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden />
              <span>
                {t("complaintCard.officialResponse")}{" "}
                {officialResponse.companySlug || officialResponse.companyName ? (
                  <Link href={`/empresa/${officialResponse.companySlug ?? slugifyName(officialResponse.companyName)}`} className="underline-offset-2 hover:underline">
                    {officialResponse.companyName}
                  </Link>
                ) : (
                  officialResponse.companyName
                )}
              </span>
              {officialResponse.createdAt_label && (
                <span className="text-zinc-500 tabular-nums">{officialResponse.createdAt_label}</span>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-800 dark:text-zinc-100">{officialResponse.content}</p>
            {(officialResponse.replies ?? []).length > 0 && (
              <div className="mt-3 space-y-2 border-l border-zinc-300/80 pl-3 dark:border-zinc-700/70">
                {(officialResponse.replies ?? []).map((reply) => (
                  <div key={reply.id} className="rounded-lg bg-white/80 p-2 ring-1 ring-zinc-200/80 dark:bg-zinc-900/30 dark:ring-0">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      <Link href={`/u/${reply.authorUserId}`} className="underline-offset-2 hover:underline">
                        {reply.authorLabel}
                      </Link>{" "}
                      {reply.createdAt_label ? `- ${reply.createdAt_label}` : ""}
                    </p>
                    <p className="text-xs whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">{reply.content}</p>
                    {canReplyToResponse && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-7 rounded-lg px-2 text-[11px]"
                        onClick={() =>
                          setReplyParentByResponse((prev) => ({ ...prev, [officialResponse.id]: reply.id }))
                        }
                      >
                        {t("complaintCard.reply")}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {canReplyToResponse && (
              <div className="mt-3">
                <Textarea
                  rows={2}
                  minLength={2}
                  maxLength={1500}
                  placeholder={
                    replyParentByResponse[officialResponse.id]
                      ? t("complaintCard.placeholderNestedReply")
                      : t("complaintCard.placeholderReply")
                  }
                  value={replyDrafts[officialResponse.id] ?? ""}
                  onChange={(event) =>
                    setReplyDrafts((prev) => ({ ...prev, [officialResponse.id]: event.target.value }))
                  }
                />
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 rounded-lg px-3 text-xs"
                    disabled={replyPending}
                    onClick={() => onSubmitReply(officialResponse.id)}
                  >
                    {t("complaintCard.send")}
                  </Button>
                  {replyParentByResponse[officialResponse.id] && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg px-2 text-xs"
                      onClick={() =>
                        setReplyParentByResponse((prev) => ({ ...prev, [officialResponse.id]: null }))
                      }
                    >
                      {t("complaintCard.cancelNestedReply")}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {(complaint.tags ?? []).length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {(complaint.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900 ring-1 ring-inset ring-emerald-200/80 dark:bg-zinc-950/25 dark:text-emerald-200 dark:ring-emerald-500/20"
              >
                <Tag className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="button"
            variant={hasEndorsed ? "secondary" : "outline"}
            size="sm"
            className={cn(
              "h-9 rounded-xl px-3 text-xs",
              hasEndorsed
                ? "text-orange-800 ring-orange-300/60 hover:ring-orange-400/50 dark:text-orange-200 dark:ring-orange-500/25 dark:hover:ring-orange-400/35"
                : "text-zinc-800 dark:text-zinc-200"
            )}
            aria-pressed={hasEndorsed}
            disabled={currentUserId == null || endorsePending}
            onClick={onToggleEndorsement}
            title={currentUserId == null ? "Inicie sessão para apoiar" : hasEndorsed ? "Remover apoio" : "Apoiar"}
          >
            <Flame className={cn("h-4 w-4", hasEndorsed ? "text-orange-600 dark:text-orange-500" : "text-zinc-500 dark:text-zinc-300")} aria-hidden />
            <span className="tabular-nums">{endorseCount}</span>
          </Button>

          <Button
            type="button"
            variant={isSubscribed ? "secondary" : "outline"}
            size="sm"
            className="h-9 rounded-xl px-3 text-xs"
            onClick={onToggleSubscription}
            disabled={!canSubscribe || subscriptionPending}
          >
            {isSubscribed ? (
              <BellRing className="h-4 w-4 text-red-600 dark:text-red-300" aria-hidden />
            ) : (
              <Bell className="h-4 w-4 text-zinc-500 dark:text-zinc-300" aria-hidden />
            )}
            <span className="hidden sm:inline">{isSubscribed ? t("complaintCard.following") : t("complaintCard.follow")}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl px-3 text-xs"
            onClick={() => setAiOpen(true)}
          >
            <Brain className="h-4 w-4 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
            <span className="hidden sm:inline">{t("complaintCard.aiInsights")}</span>
            <span className="sm:hidden">{t("complaintCard.aiShort")}</span>
          </Button>

          {commentInTopicHref ? (
            <Link
              href={commentInTopicHref}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-violet-300/90 bg-violet-50/80 px-3 text-xs font-medium text-violet-900 shadow-sm transition hover:bg-violet-100/90 dark:border-violet-500/35 dark:bg-violet-500/10 dark:text-violet-100 dark:hover:bg-violet-500/20"
            >
              <MessageSquare className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {t("complaintCard.commentInTopic")}
            </Link>
          ) : null}

          {canRespondAsCompany && (
          <>
            {!showResponseForm ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl px-3 text-xs"
                onClick={() => setShowResponseForm(true)}
              >
                <Building2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
                <span>{t("complaintCard.respondAsCompany")}</span>
              </Button>
            ) : (
              <ComplaintCompanyResponseForm
                companyOptions={companyOptions}
                selectedCompanyId={selectedCompanyId}
                onSelectCompany={setSelectedCompanyId}
                officialResponseContent={officialResponseContent}
                onChangeContent={setOfficialResponseContent}
                replyPending={replyPending}
                onSubmit={onSubmitOfficialResponse}
                onCancel={() => setShowResponseForm(false)}
              />
            )}
          </>
        )}
        </div>
        {actionError && (
          <div className="mt-2 text-sm leading-6 text-red-300">{actionError}</div>
        )}
        <AiContextModal complaintId={complaint.id} open={aiOpen} onOpenChange={setAiOpen} />
        {actions && <div className="mt-3">{actions}</div>}
      </CardContent>
    </Card>
  );
}
