"use client";

import { Send, X } from "lucide-react";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { useI18n } from "../providers/I18nProvider";

export type CompanyOption = { id: string; name: string };

export function ComplaintCompanyResponseForm({
  companyOptions,
  selectedCompanyId,
  onSelectCompany,
  officialResponseContent,
  onChangeContent,
  replyPending,
  onSubmit,
  onCancel,
}: {
  companyOptions: CompanyOption[];
  selectedCompanyId: string;
  onSelectCompany: (id: string) => void;
  officialResponseContent: string;
  onChangeContent: (value: string) => void;
  replyPending: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();

  return (
    <form onSubmit={onSubmit} className="w-full animate-in slide-in-from-bottom-2">
      <div className="mb-2">
        <select
          required
          value={selectedCompanyId}
          onChange={(event) => onSelectCompany(event.target.value)}
          className="h-10 w-full rounded-xl border border-zinc-300/90 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-100"
        >
          <option value="" disabled>
            {t("complaintCard.selectCompany")}
          </option>
          {companyOptions.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>
      <Textarea
        required
        minLength={10}
        maxLength={2000}
        placeholder={t("complaintCard.officialResponsePlaceholder")}
        rows={3}
        value={officialResponseContent}
        onChange={(event) => onChangeContent(event.target.value)}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="submit" size="sm" className="h-9 rounded-xl" disabled={replyPending || !selectedCompanyId}>
          <Send className="h-4 w-4" aria-hidden />
          <span>{t("complaintCard.send")}</span>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" aria-hidden />
          <span>{t("complaintCard.cancel")}</span>
        </Button>
      </div>
    </form>
  );
}
