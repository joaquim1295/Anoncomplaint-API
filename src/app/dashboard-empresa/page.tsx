import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "../../components/layout/PageHeader";
import { getI18n } from "../../lib/i18n/request";
import { getMessage } from "../../lib/i18n/dict";
import { getResolvedAccountMode } from "../../lib/accountMode";
import * as complaintService from "../../lib/complaintService";
import * as inboxService from "../../lib/services/inbox-service";
import { DashboardEmpresaView } from "./view";

export const metadata: Metadata = {
  title: "Painel Empresa",
  description: "Gestão de denúncias e mensagens como empresa.",
};

export default async function DashboardEmpresaPage() {
  const ctx = await getResolvedAccountMode();
  if (!ctx.user) redirect("/login?from=/dashboard-empresa");
  if (!ctx.canCompanyMode || ctx.mode !== "company") redirect("/");

  const [{ messages }, complaints, conversations] = await Promise.all([
    getI18n(),
    complaintService.getFeedForOwnedCompaniesDashboard(ctx.user.userId, { limit: 200 }),
    inboxService.listConversationsForActor(ctx.user.userId),
  ]);

  const tr = (key: string) => getMessage(messages, key);

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <PageHeader title={tr("dashboard.pageTitle")} iconName="briefcaseBusiness" />
        <DashboardEmpresaView companies={ctx.companies} complaints={complaints} conversations={conversations} />
      </div>
    </div>
  );
}
