import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/getUser";
import { UserRole } from "../../types/user";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) redirect("/");
  return <>{children}</>;
}
