import type { Metadata } from "next";
import { PageHeader } from "../../components/layout/PageHeader";
import { getI18n } from "../../lib/i18n/request";
import { getMessage } from "../../lib/i18n/dict";
import { ApiDocsClient } from "./ApiDocsClient";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getI18n();
  return {
    title: getMessage(messages, "meta.pages.apiDocs.title"),
    description: getMessage(messages, "meta.pages.apiDocs.description"),
  };
}

export default async function ApiDocsPage() {
  const { messages } = await getI18n();
  const tr = (key: string) => getMessage(messages, key);

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <PageHeader title={tr("apiDocs.title")} iconName="fileText" />
        <ApiDocsClient />
      </div>
    </div>
  );
}
