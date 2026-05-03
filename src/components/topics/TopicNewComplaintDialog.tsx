"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { PlusCircle, X } from "lucide-react";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { ComplaintForm } from "../ComplaintForm";
import { Button } from "../ui/Button";
import { useI18n } from "../providers/I18nProvider";

export function TopicNewComplaintDialog({ slug, isLoggedIn }: { slug: string; isLoggedIn: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!isLoggedIn) {
    return (
      <Button
        type="button"
        variant="default"
        className="shrink-0 rounded-xl px-4 py-2 text-sm"
        onClick={() => router.push(`/login?from=${encodeURIComponent(`/t/${slug}`)}`)}
      >
        {t("topicPage.loginToCreate")}
      </Button>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button type="button" variant="default" className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm">
          <PlusCircle className="h-4 w-4" aria-hidden />
          {t("topicPage.newComplaintInTopic")}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-[50%] z-50 flex max-h-[min(92dvh,820px)] w-[min(100vw-1.25rem,42rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-800/80 dark:bg-zinc-950 dark:ring-1 dark:ring-inset dark:ring-zinc-800/80 sm:w-[min(100vw-2rem,48rem)]">
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-200/90 px-4 py-3 dark:border-zinc-800/70">
            <Dialog.Title className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t("topicPage.newComplaintDialogTitle")}{" "}
              <span className="font-mono text-emerald-600 dark:text-emerald-400">/{slug}</span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl" aria-label={t("quickComplaint.close")}>
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-3 sm:px-4">
            <Suspense fallback={<p className="text-sm text-zinc-500 dark:text-zinc-400">{t("quickComplaint.loading")}</p>}>
              <ComplaintForm variant="modal" forcedTopicSlug={slug} />
            </Suspense>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
