"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { Label } from "../ui/Label";
import { useI18n } from "../providers/I18nProvider";

export function EditOwnComplaintButton({
  complaintId,
  title,
  content,
  disabled,
  disabledReason,
}: {
  complaintId: string;
  title: string;
  content: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [contentDraft, setContentDraft] = useState(content);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setTitleDraft(title);
      setContentDraft(content);
    }
  }, [title, content, open]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const tTrim = titleDraft.trim();
    const cTrim = contentDraft.trim();
    if (tTrim.length < 1 || tTrim.length > 100) {
      toast.error(t("activities.editTitleInvalid"));
      return;
    }
    if (cTrim.length < 10 || cTrim.length > 2000) {
      toast.error(t("activities.editContentInvalid"));
      return;
    }
    startTransition(async () => {
      const response = await fetch(`/api/v1/complaints/${complaintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: tTrim, content: cTrim }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.error?.message ?? t("activities.toastEditError"));
        return;
      }
      toast.success(t("activities.toastEditOk"));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-xl px-2 text-xs"
          disabled={disabled}
          title={disabled ? disabledReason : undefined}
        >
          <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden />
          <span>{t("activities.editComplaint")}</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] max-h-[min(88vh,32rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 dark:border-zinc-800/90 dark:bg-zinc-950">
          <div className="mb-4 flex items-start justify-between gap-3">
            <Dialog.Title className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t("activities.editDialogTitle")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 shrink-0 rounded-full p-0" aria-label={t("complaintCard.cancel")}>
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <p className="mb-4 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{t("activities.editHint")}</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={`edit-title-${complaintId}`} className="text-xs text-zinc-600 dark:text-zinc-400">
                {t("activities.titleLabel")}
              </Label>
              <input
                id={`edit-title-${complaintId}`}
                value={titleDraft}
                onChange={(ev) => setTitleDraft(ev.target.value)}
                maxLength={100}
                required
                className="h-10 w-full rounded-xl border border-zinc-300/90 bg-white px-3 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`edit-content-${complaintId}`} className="text-xs text-zinc-600 dark:text-zinc-400">
                {t("activities.contentLabel")}
              </Label>
              <Textarea
                id={`edit-content-${complaintId}`}
                value={contentDraft}
                onChange={(ev) => setContentDraft(ev.target.value)}
                minLength={10}
                maxLength={2000}
                rows={8}
                required
                className="min-h-[140px] resize-y"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost" size="sm" disabled={pending}>
                  {t("complaintCard.cancel")}
                </Button>
              </Dialog.Close>
              <Button type="submit" size="sm" disabled={pending}>
                {t("activities.saveEdit")}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
