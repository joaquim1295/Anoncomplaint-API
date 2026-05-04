"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import type { OfficialResponseReplyDisplay } from "../../types/complaint";
import { UserRole } from "../../types/user";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { useI18n } from "../providers/I18nProvider";

export function OfficialResponseReplyRow({
  complaintId,
  responseId,
  reply,
  currentUserId,
  currentUserRole,
  showReplyButton,
  onReplyClick,
  variant = "default",
}: {
  complaintId: string;
  responseId: string;
  reply: OfficialResponseReplyDisplay;
  currentUserId: string | null;
  currentUserRole: string | null;
  showReplyButton?: boolean;
  onReplyClick?: () => void;
  variant?: "default" | "dark";
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(reply.content);
  const [pending, startTransition] = useTransition();
  const isAdmin = currentUserRole === UserRole.ADMIN;
  const isOwner = currentUserId != null && reply.authorUserId === currentUserId;
  const canModify = isAdmin || isOwner;
  const isDark = variant === "dark";

  useEffect(() => {
    if (!editing) setDraft(reply.content);
  }, [reply.content, reply.id, editing]);

  function save() {
    const text = draft.trim();
    if (text.length < 2) return;
    startTransition(async () => {
      const res = await fetch(`/api/v1/complaints/${complaintId}/responses/${responseId}/replies/${reply.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: text }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(result?.error?.message ?? t("complaintCard.replyEditError"));
        return;
      }
      setEditing(false);
      toast.success(t("complaintCard.replyEditOk"));
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(t("complaintCard.replyDeleteConfirm"))) return;
    startTransition(async () => {
      const res = await fetch(`/api/v1/complaints/${complaintId}/responses/${responseId}/replies/${reply.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(result?.error?.message ?? t("complaintCard.replyDeleteError"));
        return;
      }
      toast.success(t("complaintCard.replyDeleteOk"));
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "rounded-lg p-2",
        isDark ? "bg-zinc-950/35 ring-1 ring-inset ring-zinc-800/80" : "bg-white/80 ring-1 ring-zinc-200/80 dark:bg-zinc-900/30 dark:ring-0"
      )}
    >
      <p className={cn("text-xs", isDark ? "text-zinc-400" : "text-zinc-600 dark:text-zinc-400")}>
        <Link href={`/u/${reply.authorUserId}`} className="underline-offset-2 hover:underline">
          {reply.authorLabel}
        </Link>{" "}
        {reply.createdAt_label ? `- ${reply.createdAt_label}` : ""}
      </p>
      {editing ? (
        <div className="mt-2 space-y-2">
          <Textarea
            rows={3}
            minLength={2}
            maxLength={1500}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={isDark ? "border-zinc-700 bg-zinc-900/40 text-zinc-100" : undefined}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" className="h-8 text-xs" disabled={pending} onClick={save}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : t("complaintCard.replySave")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              disabled={pending}
              onClick={() => {
                setEditing(false);
                setDraft(reply.content);
              }}
            >
              {t("complaintCard.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <p className={cn("whitespace-pre-wrap text-xs", isDark ? "text-zinc-200" : "text-zinc-800 dark:text-zinc-200")}>
          {reply.content}
        </p>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {showReplyButton && onReplyClick && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 rounded-lg px-2 text-[11px]"
            onClick={onReplyClick}
          >
            {t("complaintCard.reply")}
          </Button>
        )}
        {canModify && !editing && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 gap-1 rounded-lg px-2 text-[11px]",
                isDark ? "text-zinc-300 hover:text-white" : ""
              )}
              onClick={() => setEditing(true)}
              title={t("complaintCard.replyEdit")}
            >
              <Pencil className="h-3 w-3 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{t("complaintCard.replyEdit")}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 gap-1 rounded-lg px-2 text-[11px] text-red-600 dark:text-red-400",
                isDark ? "hover:text-red-300" : ""
              )}
              onClick={remove}
              disabled={pending}
              title={t("complaintCard.replyDelete")}
            >
              <Trash2 className="h-3 w-3 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{t("complaintCard.replyDelete")}</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
