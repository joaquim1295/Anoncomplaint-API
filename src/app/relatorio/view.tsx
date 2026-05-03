"use client";

import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import { BookOpen, Cpu, Database, FileText, Lock, Radar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { buttonVariants } from "../../components/ui/Button";
import { FeatureItem } from "./components/FeatureItem";
import { cn } from "../../lib/utils";
import { SmartComplaintMark } from "../../components/brand/SmartComplaintMark";
import { useI18n } from "../../components/providers/I18nProvider";
import type { AppLocale } from "../../lib/i18n/constants";

function localeToBcp47(locale: AppLocale): string {
  if (locale === "pt") return "pt-PT";
  if (locale === "es") return "es-ES";
  return "en-US";
}

interface RelatorioViewProps {
  userId: string | null;
  generatedAt: string;
}

export function RelatorioView({ userId, generatedAt }: RelatorioViewProps) {
  const { t, locale } = useI18n();
  const dateLabel = new Date(generatedAt).toLocaleString(localeToBcp47(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const tabTrigger =
    "rounded-xl px-4 py-2 text-sm font-medium tracking-tight text-zinc-600 transition data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm dark:text-zinc-400 dark:data-[state=active]:bg-zinc-900/80 dark:data-[state=active]:text-zinc-100";

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/90 pb-5 dark:border-zinc-800/70">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium tracking-[0.16em] text-emerald-800 ring-1 ring-inset ring-emerald-500/35 dark:text-emerald-200 dark:ring-emerald-500/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm dark:bg-emerald-400 dark:shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              <span>{t("report.badge")}</span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{t("report.title")}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("report.subtitle")}{" "}
              <SmartComplaintMark size="sm" className="inline align-baseline" />.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <p className="tabular-nums">
              {t("report.generated")} {dateLabel}
            </p>
            <p className="tabular-nums">
              {t("report.sessionContext")}{" "}
              {userId ? (
                <span className="text-emerald-700 dark:text-emerald-300">
                  {t("report.authenticated")} ({userId.slice(0, 6)}…)
                </span>
              ) : (
                <span className="text-zinc-500">{t("report.noSession")}</span>
              )}
            </p>
          </div>
        </header>

        <Tabs.Root defaultValue="report" className="space-y-6">
          <Tabs.List
            className={cn(
              "inline-flex w-full max-w-full flex-wrap gap-1 rounded-2xl border border-zinc-200/90 bg-zinc-100/80 p-1.5",
              "dark:border-zinc-800/70 dark:bg-zinc-950/40"
            )}
            aria-label={t("report.sectionsAria")}
          >
            <Tabs.Trigger value="report" className={tabTrigger}>
              <span className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0" aria-hidden />
                {t("report.tabReport")}
              </span>
            </Tabs.Trigger>
            <Tabs.Trigger value="api" className={tabTrigger}>
              <span className="inline-flex items-center gap-2">
                <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                {t("report.tabApi")}
              </span>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="report" className="space-y-6 outline-none">
            <Card className="overflow-hidden border border-zinc-200/90 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-950/40">
              <CardHeader className="relative pb-4">
                <div className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.12),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.16),_transparent_60%)]" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle>Stack Técnico</CardTitle>
                    <p className="text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                      Next.js 16.1 (App Router), React 19, MongoDB (Mongoose), TailwindCSS, Radix UI, lucide-react e sonner.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 rounded-xl bg-zinc-100/90 px-3 py-2 text-[11px] font-medium text-zinc-600 ring-1 ring-inset ring-zinc-200/90 dark:bg-zinc-950/60 dark:text-zinc-300 dark:ring-zinc-700/80">
                    <Radar className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
                    <span>Tema claro / escuro</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 border-t border-zinc-200/90 bg-gradient-to-br from-zinc-50/90 via-white to-zinc-100/80 pt-4 dark:border-zinc-800/80 dark:from-zinc-950/60 dark:via-zinc-950/40 dark:to-zinc-950/80 md:grid-cols-3">
                <FeatureItem
                  icon={<Cpu className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />}
                  title="Camada de Apresentação"
                  desc="Next.js App Router + React 19"
                  content="A UI é composta por Server Components que orquestram dados e Client Components interativos (ComplaintItem, RageMap, CompanyDashboard, Relatório). O estado é mantido com hooks React e transições assíncronas para garantir fluidez mesmo sob alta latência."
                />
                <FeatureItem
                  icon={<Database className="h-4 w-4 text-cyan-600 dark:text-cyan-300/90" aria-hidden />}
                  title="Serviços e Repositórios"
                  desc="Arquitetura em camadas"
                  content="Server Actions chamam serviços (`complaintService`, `notificationService`, `companyService`) que encapsulam regras de negócio e delegam persistência a repositórios Mongoose. Cada repositório é responsável por querys otimizadas, índices e agregações específicas de domínio."
                />
                <FeatureItem
                  icon={<Lock className="h-4 w-4 text-red-600 dark:text-red-300/90" aria-hidden />}
                  title="Autorização e Segurança"
                  desc="JWT + Guards por role"
                  content="Rotas sensíveis (`/admin`, `/dashboard-empresa`, `/activities`, `/relatorio`) utilizam guards baseados em JWT e roles (`USER`, `COMPANY`, `ADMIN`). Acesso a ações como resposta oficial, alteração de estado ou eliminação de denúncia é sempre validado no servidor antes de tocar na base de dados."
                />
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border border-zinc-200/90 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-950/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
                    <CardTitle>{t("report.flowTitle")}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                  <p>
                    1. O utilizador submete uma denúncia através de um formulário validado por Zod, com suporte opcional para geolocalização e modo anónimo.
                  </p>
                  <p>
                    2. A camada de serviços avalia o conteúdo (moderation/toxicity), define o estado inicial (`pending` ou `pending_review`) e grava no MongoDB com índices por autor, data e localização.
                  </p>
                  <p>
                    3. O feed público é paginado e agregado para métricas (Rage Meter, mapa de calor, tendências semanais), mantendo a experiência de leitura rápida e consistente.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-zinc-200/90 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-950/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-red-600 dark:text-red-300/90" aria-hidden />
                    <CardTitle>{t("report.accessTitle")}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                  <p>
                    • Perfis de empresa podem responder oficialmente e gerir estados apenas em denúncias às quais já responderam, reforçando o princípio do mínimo privilégio.
                  </p>
                  <p>
                    • Ações administrativas (banir utilizadores, remoção forçada) passam por Server Actions dedicadas, com validação explícita de role `ADMIN` e revalidação seletiva de cache.
                  </p>
                  <p>
                    • Todas as interações críticas são propagadas para o UI de forma consistente através de invalidação de rota e estados de loading claros nos botões.
                  </p>
                </CardContent>
              </Card>
            </div>
          </Tabs.Content>

          <Tabs.Content value="api" className="space-y-4 outline-none">
            <Card className="border border-zinc-200/90 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-950/40">
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
                  {t("report.apiDocTitle")}
                </CardTitle>
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{t("report.apiDocIntro")}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/api-docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "default" }), "w-full justify-center sm:w-auto")}
                >
                  {t("report.linkSwagger")}
                </Link>
                <Link
                  href="/api/v1/openapi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center sm:w-auto")}
                >
                  {t("report.linkOpenapi")}
                </Link>
                <Link
                  href="/api/v1/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center sm:w-auto")}
                >
                  {t("report.linkHealth")}
                </Link>
              </CardContent>
            </Card>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {t("report.devTipBefore")}{" "}
              <code className="rounded bg-zinc-200/80 px-1 py-0.5 text-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200">/api-docs</code>{" "}
              {t("report.devTipAfter")}
            </p>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
