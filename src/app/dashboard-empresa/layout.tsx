import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getCurrentUser } from "../../lib/getUser";
import { UserRole } from "../../types/user";

export default async function DashboardEmpresaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.COMPANY) {
    redirect("/");
  }
  return <>{children}</>;
}
