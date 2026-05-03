import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/getUser";
import { UserRole } from "../../types/user";
import { RelatorioView } from "./view";

export const metadata: Metadata = {
  title: "Relatório técnico",
  description: "Arquitetura, fluxos de dados e garantias de segurança da plataforma.",
};

export default async function RelatorioPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    redirect("/");
  }
  const now = new Date();
  return <RelatorioView userId={user.userId} generatedAt={now.toISOString()} />;
}

