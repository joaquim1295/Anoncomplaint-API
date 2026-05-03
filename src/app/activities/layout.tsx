import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getResolvedAccountMode } from "../../lib/accountMode";

export default async function ActivitiesLayout({ children }: { children: ReactNode }) {
  const ctx = await getResolvedAccountMode();
  if (ctx.user && ctx.mode === "company") {
    redirect("/dashboard-empresa");
  }
  return <>{children}</>;
}
