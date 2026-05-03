"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Clock3, Hash, PencilLine, Send, User2 } from "lucide-react";
import { toast } from "sonner";
import type { ComplaintDisplay } from "../../../types/complaint";
import { UserRole } from "../../../types/user";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/Textarea";
import { getPusherClient } from "../../../lib/realtime/pusher-client";
import { useI18n } from "../../../components/providers/I18nProvider";
import { AiTranslateTextBlock } from "../../../components/i18n/AiTranslateTextBlock";
import { ComplaintCompanyResponseForm } from "../../../components/complaints/ComplaintCompanyResponseForm";

type CompanyOption = { id: string; name: string };

function slugifyName(name: string): string {
  return String(name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ComplaintDetailView({
  complaint,
  currentUserId,
  currentUserRole,
  backTopicSlug,
}: {
  complaint: ComplaintDisplay;
  currentUserId: string | null;
  currentUserRole: string | null;
  /** Quando se abre a denúncia a partir de /t/[slug] (?fromTopic=). */
  backTopicSlug?: string | null;
}) {
  const router = useRouter();
  const { t, locale: appLocale } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [officialPending, startOfficialTransition] = useTransition();
  const [replyDraft, setReplyDraft] = useState("");
  const [rating, setRating] = useState(10);
  const [timelineDateLabels, setTimelineDateLabels] = useState<Record<string, string>>({});
  const [accountMode, setAccountMode] = useState<"personal" | "company">("personal");
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [showCompanyResponseForm, setShowCompanyResponseForm] = useState(false);
  const [officialResponseContent, setOfficialResponseContent] = useState("");

  const dateLocaleTag = appLocale === "en" ? "en-GB" : appLocale === "es" ? "es" : "pt-PT";

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const r of complaint.officialResponses ?? []) {
      map[r.id] = new Date(r.createdAt).toLocaleString(dateLocaleTag);
      for (const rep of r.replies ?? []) {
        map[rep.id] = new Date(rep.createdAt).toLocaleString(dateLocaleTag);
      }
    }
    setTimelineDateLabels(map);
  }, [complaint, dateLocaleTag]);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;
    const ch = pusher.subscribe("complaints-feed");
    ch.bind("complaint-updated", (data: { complaintId?: string }) => {
      if (data.complaintId === complaint.id) {
        router.refresh();
        toast.info(t("complaintDetail.timelineUpdated"));
      }
    });
    return () => {
      ch.unbind_all();
      pusher.unsubscribe("complaints-feed");
    };
  }, [complaint.id, router, t]);

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
    const isCo = currentUserRole === UserRole.COMPANY;
    const adm = currentUserRole === UserRole.ADMIN;
    if (!isCo && !adm) return;
    void (async () => {
      const response = await fetch("/api/v1/company/companies", { credentials: "include" });
      const result = await response.json().catch(() => null);
      const companies = Array.isArray(result?.data) ? result.data : [];
      setCompanyOptions(companies);
      if (companies.length > 0) {
        setSelectedCompanyId(companies[0].id);
      }
    })();
  }, [currentUserRole]);

  const firstResponse = useMemo(() => (complaint.officialResponses ?? [])[0], [complaint]);

  const isCompanyRole = currentUserRole === UserRole.COMPANY;
  const isAdmin = currentUserRole === UserRole.ADMIN;
  const hasCompanyTargetByOwner =
    currentUserId != null && (complaint.officialResponses ?? []).some((r) => r.companyOwnerUserId === currentUserId);
  const hasCompanyTargetByTag =
    isCompanyRole &&
    (complaint.tags ?? []).some((tag) => companyOptions.some((co) => String(co.id) === String(tag)));
  const canRespondAsCompany =
    currentUserId != null &&
    accountMode === "company" &&
    (isAdmin || (isCompanyRole && (hasCompanyTargetByOwner || hasCompanyTargetByTag)));

  function submitReply() {
    if (!firstResponse) return;
    startTransition(async () => {
      const response = await fetch(
        `/api/v1/complaints/${complaint.id}/responses/${firstResponse.id}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: replyDraft }),
        }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.error?.message ?? "Não foi possível enviar réplica.");
        return;
      }
      setReplyDraft("");
      router.refresh();
    });
  }

  function markResolved() {
    startTransition(async () => {
      const response = await fetch(`/api/v1/complaints/${complaint.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "resolved" }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.error?.message ?? "Não foi possível marcar como resolvida.");
        return;
      }
      toast.success("Denúncia marcada como resolvida.");
      router.refresh();
    });
  }

  function submitRating() {
    startTransition(async () => {
      const response = await fetch(`/api/v1/complaints/${complaint.id}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.error?.message ?? "Não foi possível avaliar.");
        return;
      }
      toast.success("Avaliação registrada.");
      router.refresh();
    });
  }

  function onSubmitOfficialResponse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startOfficialTransition(async () => {
      const response = await fetch(`/api/v1/company/complaints/${complaint.id}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ companyId: selectedCompanyId, content: officialResponseContent }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.error?.message ?? t("complaintCard.toastOfficialError"));
        return;
      }
      setOfficialResponseContent("");
      setShowCompanyResponseForm(false);
      router.refresh();
    });
  }

  const canConsumerInteract = currentUserRole === "user" && currentUserId === complaint.author_id;

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

  const backHref = backTopicSlug ? `/t/${encodeURIComponent(backTopicSlug)}` : "/";

  return (
    <div suppressHydrationWarning className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl space-y-5">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-zinc-100">
          <ArrowLeft className="h-4 w-4" />
          {backTopicSlug ? (
            <>
              {t("complaintDetail.backToTopic")}{" "}
              <span className="font-mono text-zinc-400">/{backTopicSlug}</span>
            </>
          ) : (
            t("complaintDetail.backToFeed")
          )}
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>{complaint.title || t("complaintDetail.untitled")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              {(complaint.companySlug || complaint.companyName) && complaint.companyName && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/30 px-2 py-1 ring-1 ring-inset ring-zinc-800/70">
                  <Building2 className="h-3.5 w-3.5 text-emerald-300/80" />
                  <Link href={`/empresa/${complaint.companySlug ?? slugifyName(complaint.companyName)}`} className="underline-offset-2 hover:underline">
                    {complaint.companyName}
                  </Link>
                </span>
              )}
              {complaint.author_id && complaint.author_label !== "Anónimo" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/30 px-2 py-1 ring-1 ring-inset ring-zinc-800/70">
                  <User2 className="h-3.5 w-3.5 text-emerald-300/80" />
                  <Link href={`/u/${complaint.author_id}`} className="underline-offset-2 hover:underline">
                    {complaint.author_label}
                  </Link>
                </span>
              )}
              {complaint.topic_slug && (
                <Link
                  href={`/t/${complaint.topic_slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-2 py-1 text-violet-200 ring-1 ring-inset ring-violet-500/35 hover:bg-violet-500/25"
                >
                  <Hash className="h-3.5 w-3.5" aria-hidden />
                  <span className="font-mono">/{complaint.topic_slug}</span>
                </Link>
              )}
              {editedAtLabel && (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 font-medium text-amber-100 ring-1 ring-inset ring-amber-500/25"
                  title={editedAtLabel}
                >
                  <PencilLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {t("complaintCard.editedBadge")}
                </span>
              )}
            </div>
            <AiTranslateTextBlock
              text={complaint.content}
              variant="dark"
              paragraphClassName="whitespace-pre-wrap text-sm leading-6 text-zinc-100"
            />
            {(complaint.attachments ?? []).length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                {(complaint.attachments ?? []).map((img, idx) => (
                  <a key={`${complaint.id}-att-${idx}`} href={img} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg ring-1 ring-zinc-800/80">
                    <img src={img} alt={`Anexo ${idx + 1}`} className="h-24 w-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-emerald-300" /> {t("complaintDetail.timelineTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(complaint.officialResponses ?? []).map((response) => (
              <div key={response.id} className="rounded-xl bg-zinc-950/35 p-3 ring-1 ring-inset ring-zinc-800/80">
                <p className="text-xs text-zinc-400">
                  {response.companySlug || response.companyName ? (
                    <Link href={`/empresa/${response.companySlug ?? slugifyName(response.companyName)}`} className="underline-offset-2 hover:underline">
                      {response.companyName}
                    </Link>
                  ) : (
                    response.companyName
                  )}{" "}
                  - {timelineDateLabels[response.id] ?? response.createdAt_label ?? "-"}
                </p>
                <p className="text-sm text-zinc-100">{response.content}</p>
                <div className="mt-2 space-y-2 border-l border-zinc-700 pl-3">
                  {(response.replies ?? []).map((reply) => (
                    <div key={reply.id}>
                      <p className="text-xs text-zinc-400">
                        <Link href={`/u/${reply.authorUserId}`} className="underline-offset-2 hover:underline">
                          {reply.authorLabel}
                        </Link>{" "}
                        - {timelineDateLabels[reply.id] ?? reply.createdAt_label ?? "-"}
                      </p>
                      <p className="text-xs text-zinc-200">{reply.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {canRespondAsCompany && companyOptions.length > 0 && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/15 p-3 ring-1 ring-inset ring-emerald-500/20">
                {!showCompanyResponseForm ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl border-emerald-500/40 bg-emerald-950/30 text-emerald-100 hover:bg-emerald-900/40"
                    onClick={() => setShowCompanyResponseForm(true)}
                  >
                    <Building2 className="h-4 w-4 text-emerald-300" aria-hidden />
                    <span>{t("complaintCard.respondAsCompany")}</span>
                  </Button>
                ) : (
                  <ComplaintCompanyResponseForm
                    companyOptions={companyOptions}
                    selectedCompanyId={selectedCompanyId}
                    onSelectCompany={setSelectedCompanyId}
                    officialResponseContent={officialResponseContent}
                    onChangeContent={setOfficialResponseContent}
                    replyPending={officialPending}
                    onSubmit={onSubmitOfficialResponse}
                    onCancel={() => setShowCompanyResponseForm(false)}
                  />
                )}
              </div>
            )}
            {canConsumerInteract && (
              <div className="space-y-2">
                <Textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  rows={3}
                  minLength={2}
                  maxLength={1500}
                  placeholder={t("complaintDetail.replyPlaceholder")}
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={submitReply} disabled={isPending || !replyDraft.trim()}>
                    <Send className="h-4 w-4" />
                    {t("complaintDetail.sendReply")}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={markResolved} disabled={isPending}>
                    {t("complaintDetail.markResolved")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {complaint.status === "resolved" && canConsumerInteract && (
          <Card>
            <CardHeader>
              <CardTitle>{t("complaintDetail.ratingTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                type="range"
                min={0}
                max={10}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-zinc-300">
                {t("complaintDetail.currentScore")}: {rating}
              </div>
              <Button type="button" size="sm" onClick={submitRating} disabled={isPending}>
                {t("complaintDetail.sendRating")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

