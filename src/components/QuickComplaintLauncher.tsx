"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { PlusCircle, X } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ComplaintForm } from "./ComplaintForm";
import { Button } from "./ui/Button";
import { useI18n } from "./providers/I18nProvider";

function QuickComplaintLauncherContent({ showTrigger }: { showTrigger: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("openComplaint") !== "1") return;
    setOpen(true);
  }, [searchParams]);

  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("openComplaint") !== "1") return;
    const timer = window.setTimeout(() => {
      sp.delete("openComplaint");
      sp.delete("complaintCompany");
      sp.delete("complaintCname");
      const q = sp.toString();
      const base = pathname && pathname !== "" ? pathname : "/";
      router.replace(q ? `${base}?${q}` : base);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [open, router, pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {showTrigger ? (
        <Dialog.Trigger asChild>
          <Button
            type="button"
            variant="default"
            className="mt-3 w-full justify-start rounded-xl px-3 py-2 text-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t("quickComplaint.newComplaint")}</span>
          </Button>
        </Dialog.Trigger>
      ) : (
        <div className="mt-3 h-0 overflow-hidden" aria-hidden />
      )}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-[50%] z-50 flex max-h-[min(92dvh,820px)] w-[min(100vw-1.25rem,42rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-800/80 dark:bg-zinc-950 dark:ring-1 dark:ring-inset dark:ring-zinc-800/80 sm:w-[min(100vw-2rem,48rem)]">
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-200/90 px-4 py-3 dark:border-zinc-800/70">
            <Dialog.Title className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t("quickComplaint.dialogTitle")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl" aria-label={t("quickComplaint.close")}>
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-3 sm:px-4">
            <Suspense fallback={<p className="text-sm text-zinc-500 dark:text-zinc-400">{t("quickComplaint.loading")}</p>}>
              <ComplaintForm variant="modal" />
            </Suspense>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function QuickComplaintLauncherFallback({ showTrigger }: { showTrigger: boolean }) {
  const { t } = useI18n();
  if (!showTrigger) return <div className="mt-3 h-0 overflow-hidden" aria-hidden />;
  return (
    <Button type="button" variant="default" disabled className="mt-3 w-full justify-start rounded-xl px-3 py-2 text-sm opacity-60">
      <PlusCircle className="h-4 w-4" />
      <span>{t("quickComplaint.newComplaint")}</span>
    </Button>
  );
}

export function QuickComplaintLauncher({
  userLoggedIn,
  showTrigger,
}: {
  userLoggedIn: boolean;
  showTrigger: boolean;
}) {
  if (!userLoggedIn) return null;
  return (
    <Suspense fallback={<QuickComplaintLauncherFallback showTrigger={showTrigger} />}>
      <QuickComplaintLauncherContent showTrigger={showTrigger} />
    </Suspense>
  );
}
