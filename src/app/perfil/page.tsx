import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "../../lib/getUser";
import { getI18n } from "../../lib/i18n/request";
import { getMessage } from "../../lib/i18n/dict";
import { PerfilView } from "./view";
import * as companyService from "../../lib/companyService";

export const metadata: Metadata = {
  title: "O meu perfil",
  description: "Definições da conta, empresas e preferências.",
};

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/perfil");
  const [companies, { messages }] = await Promise.all([companyService.listForUser(user.userId), getI18n()]);
  const tr = (key: string) => getMessage(messages, key);
  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-full md:max-w-4xl">
        <header className="sticky top-3 z-30 mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/90 bg-white/80 px-3 py-3 shadow-sm backdrop-blur-md transition hover:border-zinc-300/90 hover:bg-white hover:shadow-md dark:border-zinc-800/70 dark:bg-zinc-950/50 dark:shadow-none dark:hover:bg-zinc-950/70 dark:hover:ring-1 dark:hover:ring-zinc-700/80">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-700 ring-cyber transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-900/45 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
            <span>{tr("profile.backToFeed")}</span>
          </Link>
          <h1 className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            <span>{tr("profile.pageTitle")}</span>
          </h1>
        </header>
        <PerfilView user={user} companies={companies} />
      </div>
    </div>
  );
}
