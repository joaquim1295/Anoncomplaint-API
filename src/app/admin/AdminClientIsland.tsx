"use client";

import dynamic from "next/dynamic";
import { useI18n } from "../../components/providers/I18nProvider";
import type { AdminComplaintRow, AdminCompanyVerificationRow, AdminUserRow } from "./page";

function AdminPanelLoading() {
  const { t } = useI18n();
  return <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("admin.loadingPanel")}</p>;
}

const AdminViewDynamic = dynamic(() => import("./view").then((m) => m.AdminView), {
  ssr: false,
  loading: AdminPanelLoading,
});

export function AdminClientIsland({
  users,
  complaints,
  companyRequests,
}: {
  users: AdminUserRow[];
  complaints: AdminComplaintRow[];
  companyRequests: AdminCompanyVerificationRow[];
}) {
  return <AdminViewDynamic users={users} complaints={complaints} companyRequests={companyRequests} />;
}
