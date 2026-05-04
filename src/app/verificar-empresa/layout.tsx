import type { Metadata } from "next";
import { getI18n } from "../../lib/i18n/request";
import { getMessage } from "../../lib/i18n/dict";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getI18n();
  return {
    title: getMessage(messages, "meta.pages.verifyCompany.title"),
    description: getMessage(messages, "meta.pages.verifyCompany.description"),
  };
}

export default function VerificarEmpresaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
