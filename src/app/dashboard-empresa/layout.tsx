import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getResolvedAccountMode } from "../../lib/accountMode";

export default async function DashboardEmpresaLayout({ children }: { children: ReactNode }) {
  const ctx = await getResolvedAccountMode();
  if (!ctx.user) redirect("/login?from=/dashboard-empresa");
  if (!ctx.canCompanyMode) redirect("/");
  if (ctx.mode !== "company") redirect("/");
  return <>{children}</>;
}
