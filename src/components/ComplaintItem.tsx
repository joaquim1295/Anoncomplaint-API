"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cva, type VariantProps } from "class-variance-authority";
import { Bell, BellRing, Building2, Calendar, Flame, MapPin, Send, ShieldCheck, Sparkles, Tag, User2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import type { ComplaintDisplay } from "../types/complaint";
import { ComplaintStatus } from "../types/complaint";
import { UserRole } from "../types/user";
import { Card, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";
import { AiContextModal } from "./complaints/AiContextModal";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
  {
    variants: {
      status: {
        [ComplaintStatus.PENDING]: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
        [ComplaintStatus.PENDING_REVIEW]: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
        [ComplaintStatus.REVIEWED]: "bg-blue-500/20 text-blue-400 border border-blue-500/40",
        [ComplaintStatus.RESOLVED]: "bg-green-500/20 text-green-400 border border-green-500/40",
        [ComplaintStatus.ARCHIVED]: "bg-gray-500/20 text-gray-400 border border-gray-500/40",
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
}

export function ComplaintItem({ complaint, actions, className, currentUserId, currentUserRole, isSubscribed: isSubscribedInitial }: ComplaintItemProps) {
  const router = useRouter();
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [officialResponseContent, setOfficialResponseContent] = useState("");
  const [endorsePending, startEndorseTransition] = useTransition();
  const [replyPending, startReplyTransition] = useTransition();
  const [subscriptionPending, startSubscriptionTransition] = useTransition();
  const [actionError, setActionError] = useState<string | undefined>(undefined);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(Boolean(isSubscribedInitial));
  const endorsedBy = complaint.endorsedBy ?? [];
  const count = endorsedBy.length;
  const hasEndorsed = currentUserId != null && endorsedBy.includes(currentUserId);
  const dateLabel = complaint.created_at_label ?? new Date(complaint.created_at).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const isCompany = currentUserRole === UserRole.COMPANY;
  const hasOfficialResponse = Boolean(complaint.officialResponse?.content);
  const hasLocation = Boolean(complaint.location && complaint.location.city);
  const canSubscribe = Boolean(currentUserId);

  function onToggleSubscription() {
    if (!currentUserId) {
      toast.error("Inicie sessão para seguir denúncias.");
      return;
    }
    startSubscriptionTransition(async () => {
      const response = await fetch(`/api/v1/subscriptions/${complaint.id}/toggle`, {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json().catch(() => null);
      const subscribed = result?.data?.subscribed;
      if (!response.ok || typeof subscribed !== "boolean") {
        toast.error(result?.error?.message ?? "Não foi possível atualizar a subscrição.");
        return;
      }
      setIsSubscribed(subscribed);
      if (subscribed) {
        toast.success("Vai receber alertas sobre esta denúncia.");
      } else {
        toast.success("Deixou de seguir esta denúncia.");
      }
    });
  }

  function onToggleEndorsement() {
    if (!currentUserId) return;
    setActionError(undefined);
    startEndorseTransition(async () => {
      const response = await fetch(`/api/v1/complaints/${complaint.id}/endorse`, {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(result?.error?.message ?? "Não foi possível atualizar o apoio.");
        return;
      }
      router.refresh();
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
        body: JSON.stringify({ content: officialResponseContent }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(result?.error?.message ?? "Não foi possível enviar a resposta oficial.");
        return;
      }
      setOfficialResponseContent("");
      setShowResponseForm(false);
      router.refresh();
    });
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/30 px-2 py-1 ring-1 ring-inset ring-zinc-800/70">
            <Calendar className="h-3.5 w-3.5 text-emerald-300/80" aria-hidden />
            <span className="tabular-nums">{dateLabel}</span>
          </span>
          <span className={cn(statusBadgeVariants({ status: complaint.status }))}>{complaint.status}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/30 px-2 py-1 ring-1 ring-inset ring-zinc-800/70">
            <User2 className="h-3.5 w-3.5 text-emerald-300/70" aria-hidden />
            <span className="truncate max-w-[180px]">{complaint.author_label}</span>
          </span>
          {hasLocation && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/30 px-2 py-1 ring-1 ring-inset ring-zinc-800/70">
              <MapPin className="h-3.5 w-3.5 text-red-300/80" aria-hidden />
              <span className="truncate max-w-[160px]">{complaint.location?.city}</span>
            </span>
          )}
        </div>
        <p className="mb-4 whitespace-pre-wrap text-sm leading-6 text-zinc-100">{complaint.content}</p>
        {complaint.officialResponse && (
          <div className="mb-4 rounded-xl bg-zinc-950/25 p-4 ring-1 ring-inset ring-emerald-500/20">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-200">
              <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden />
              <span>Resposta oficial</span>
              {complaint.officialResponse.createdAt_label && (
                <span className="text-zinc-500 tabular-nums">{complaint.officialResponse.createdAt_label}</span>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-100">{complaint.officialResponse.content}</p>
          </div>
        )}
        {(complaint.tags ?? []).length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {(complaint.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/25 px-2.5 py-1 text-xs font-medium text-emerald-200 ring-1 ring-inset ring-emerald-500/20"
              >
                <Tag className="h-3.5 w-3.5 text-emerald-300/90" aria-hidden />
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center">
          <Button
            type="button"
            variant={hasEndorsed ? "secondary" : "outline"}
            size="sm"
            className={cn(
              "h-9 rounded-xl px-3 text-xs",
              hasEndorsed ? "text-orange-200 ring-orange-500/25 hover:ring-orange-400/35" : "text-zinc-200"
            )}
            aria-pressed={hasEndorsed}
            disabled={currentUserId == null || endorsePending}
            onClick={onToggleEndorsement}
            title={currentUserId == null ? "Inicie sessão para apoiar" : hasEndorsed ? "Remover apoio" : "Apoiar"}
          >
            <Flame className={cn("h-4 w-4", hasEndorsed ? "text-orange-300" : "text-zinc-300")} aria-hidden />
            <span className="tabular-nums">{count}</span>
          </Button>
          </div>
          <Button
            type="button"
            variant={isSubscribed ? "secondary" : "outline"}
            size="sm"
            className="h-9 rounded-xl px-3 text-xs"
            onClick={onToggleSubscription}
            disabled={!canSubscribe || subscriptionPending}
          >
            {isSubscribed ? (
              <BellRing className="h-4 w-4 text-red-300" aria-hidden />
            ) : (
              <Bell className="h-4 w-4 text-zinc-300" aria-hidden />
            )}
            <span className="hidden sm:inline">{isSubscribed ? "A seguir" : "Seguir"}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl px-3 text-xs"
            onClick={() => setAiOpen(true)}
          >
            <Sparkles className="h-4 w-4 text-emerald-300/90" aria-hidden />
            <span className="hidden sm:inline">AI Insights</span>
            <span className="sm:hidden">AI</span>
          </Button>
        {isCompany && !hasOfficialResponse && (
          <>
            {!showResponseForm ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl px-3 text-xs"
                onClick={() => setShowResponseForm(true)}
              >
                <Building2 className="h-4 w-4 text-emerald-300/90" aria-hidden />
                <span>Responder como Empresa</span>
              </Button>
            ) : (
              <form onSubmit={onSubmitOfficialResponse} className="w-full animate-in slide-in-from-bottom-2">
                <Textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  placeholder="Resposta oficial (mín. 10 caracteres)"
                  rows={3}
                  value={officialResponseContent}
                  onChange={(event) => setOfficialResponseContent(event.target.value)}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="submit" size="sm" className="h-9 rounded-xl" disabled={replyPending}>
                    <Send className="h-4 w-4" aria-hidden />
                    <span>Enviar</span>
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowResponseForm(false)}>
                    <X className="h-4 w-4" aria-hidden />
                    <span>Cancelar</span>
                  </Button>
                </div>
              </form>
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
