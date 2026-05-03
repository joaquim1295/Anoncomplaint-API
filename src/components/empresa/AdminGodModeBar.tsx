"use client";

import { useTransition } from "react";
import { FlaskConical, ShieldAlert, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { useI18n } from "../providers/I18nProvider";

export function AdminGodModeBar({ companySlug }: { companySlug: string }) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  function runAction(url: string, successMessage: string, body?: Record<string, unknown>) {
    startTransition(async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.error?.message ?? t("admin.godToastFail"));
        return;
      }
      toast.success(successMessage);
    });
  }

  return (
    <div className="mb-4 rounded-2xl border border-red-300/60 bg-red-50/80 p-3 ring-1 ring-inset ring-red-500/20 dark:border-red-500/40 dark:bg-zinc-950/60 dark:ring-red-500/30">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => runAction("/api/v1/admin/god-mode/force-approve", t("admin.godToastPromoted"))}
        >
          <ShieldAlert className="h-4 w-4 text-red-300" />
          <span>{t("admin.godForceApprove")}</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            runAction("/api/v1/admin/god-mode/simulate-response", t("admin.godToastRealtime"), {
              slug: companySlug,
            })
          }
        >
          <WandSparkles className="h-4 w-4 text-emerald-300" />
          <span>{t("admin.godSimulateResponse")}</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={() => runAction("/api/v1/admin/god-mode/reset-demo", t("admin.godToastReset"))}
        >
          <FlaskConical className="h-4 w-4" />
          <span>{t("admin.godResetDemo")}</span>
        </Button>
      </div>
    </div>
  );
}

