"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { useI18n } from "../providers/I18nProvider";

type CompanyOption = { id: string; name: string; slug: string };

export function ProfileStartConversationButton({ targetUserId }: { targetUserId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/v1/company/companies", { credentials: "include" });
      const result = await res.json().catch(() => null);
      const list = Array.isArray(result?.data) ? result.data : [];
      setCompanies(list);
      if (list.length > 0) setSelectedCompanyId(String(list[0].id));
    })();
  }, []);

  function onClick() {
    startTransition(async () => {
      const companyId = selectedCompanyId || companies[0]?.id;
      if (!companyId) {
        toast.error(t("complaintCard.toastCompanyUnknown"));
        return;
      }
      const res = await fetch("/api/v1/inbox/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ companyId, userId: targetUserId }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(result?.error?.message ?? t("complaintCard.toastChatOpenError"));
        return;
      }
      const conversationId = String(result?.data?.conversationId ?? "");
      router.push(conversationId ? `/inbox?conversation=${encodeURIComponent(conversationId)}` : "/inbox");
    });
  }

  if (companies.length === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {companies.length > 1 ? (
        <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
          <span>{t("complaintCard.selectCompany")}</span>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="h-9 rounded-lg border border-zinc-200/90 bg-white px-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <Button type="button" variant="outline" size="sm" className="h-9 rounded-xl px-3 text-xs" disabled={pending} onClick={onClick}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Inbox className="h-4 w-4 text-emerald-700 dark:text-emerald-300/90" aria-hidden />}
        <span>{t("publicProfile.startConversation")}</span>
      </Button>
    </div>
  );
}
