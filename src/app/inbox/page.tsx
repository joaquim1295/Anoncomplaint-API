import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "../../components/layout/PageHeader";
import { getI18n } from "../../lib/i18n/request";
import { getMessage } from "../../lib/i18n/dict";
import { getResolvedAccountMode } from "../../lib/accountMode";
import * as companyService from "../../lib/companyService";
import * as inboxService from "../../lib/services/inbox-service";
import { InboxView } from "./view";

export const metadata: Metadata = {
  title: "Caixa de entrada",
  description: "Mensagens e conversas com empresas e moderadores.",
};

export default async function InboxPage() {
  const ctx = await getResolvedAccountMode();
  if (!ctx.user) redirect("/login?from=/inbox");

  const { messages } = await getI18n();
  const tr = (key: string) => getMessage(messages, key);

  const [conversations, companies] = await Promise.all([
    inboxService.listConversationsForActor(ctx.user.userId),
    companyService.listForUser(ctx.user.userId),
  ]);

  const ownedCompanies = companies.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <PageHeader title={tr("inbox.inbox")} iconName="inbox" variant="sticky" />
        <InboxView
          accountMode={ctx.mode}
          currentUserId={ctx.user.userId}
          initialConversations={conversations}
          ownedCompanies={ownedCompanies}
        />
      </div>
    </div>
  );
}
