"use client";

import type { Company } from "../../types/company";
import type { ComplaintDisplay } from "../../types/complaint";
import type { InboxConversationItem } from "../../lib/services/inbox-service";
import { CompanyManagementPanel } from "../../components/dashboard/CompanyManagementPanel";

export function DashboardEmpresaView({
  companies,
  complaints,
  conversations,
}: {
  companies: Company[];
  complaints: ComplaintDisplay[];
  conversations: InboxConversationItem[];
}) {
  return <CompanyManagementPanel companies={companies} complaints={complaints} conversations={conversations} />;
}
