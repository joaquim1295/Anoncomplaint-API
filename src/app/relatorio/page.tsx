import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/getUser";
import { UserRole } from "../../types/user";
import { RelatorioView } from "./view";
import { getI18n } from "../../lib/i18n/request";
import { getMessage } from "../../lib/i18n/dict";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getI18n();
  return {
    title: getMessage(messages, "meta.pages.report.title"),
    description: getMessage(messages, "meta.pages.report.description"),
  };
}

export default async function RelatorioPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    redirect("/");
  }
  const now = new Date();
  return <RelatorioView userId={user.userId} generatedAt={now.toISOString()} />;
}

