import { redirect } from "next/navigation";
import { getResolvedAccountMode } from "../../lib/accountMode";
import { UserRole } from "../../types/user";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ctx = await getResolvedAccountMode();
  if (!ctx.user || ctx.user.role !== UserRole.ADMIN) redirect("/");
  if (ctx.mode === "company") redirect("/");
  return <>{children}</>;
}
