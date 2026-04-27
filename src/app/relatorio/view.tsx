"use client";

import { Cpu, Database, FileText, Lock, Radar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { FeatureItem } from "./components/FeatureItem";

interface RelatorioViewProps {
  userId: string | null;
  generatedAt: string;
}

export function RelatorioView({ userId, generatedAt }: RelatorioViewProps) {
  const dateLabel = new Date(generatedAt).toLocaleString("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/70 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium tracking-[0.16em] text-emerald-200 ring-1 ring-inset ring-emerald-500/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              <span>RELATÓRIO TÉCNICO</span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
              Arquitetura e Controlo de Denúncias
            </h1>
            <p className="text-sm text-zinc-400">
              Visão de alto nível da infraestrutura, fluxo de dados e garantias de segurança da plataforma AnonComplaint.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs text-zinc-400">
            <p className="tabular-nums">Gerado em: {dateLabel}</p>
            <p className="tabular-nums">
              Contexto de sessão:{" "}
              {userId ? (
                <span className="text-emerald-300">utilizador autenticado ({userId.slice(0, 6)}…)</span>
              ) : (
                <span className="text-zinc-500">sem sessão ativa</span>
              )}
            </p>
          </div>
        </header>

        <Card className="overflow-hidden border border-zinc-800/80 bg-zinc-950/40">
          <CardHeader className="relative pb-4">
            <div className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.16),_transparent_60%)]" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Stack Técnico</CardTitle>
                <p className="text-xs leading-5 text-zinc-400">
                  Next.js 16.1 (App Router), React 19, MongoDB (Mongoose), TailwindCSS, Radix UI, lucide-react e sonner.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-zinc-950/60 px-3 py-2 text-[11px] font-medium text-zinc-300 ring-1 ring-inset ring-zinc-700/80">
                <Radar className="h-4 w-4 text-emerald-300/90" aria-hidden />
                <span>Modo dark cibernético</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 border-t border-zinc-800/80 bg-gradient-to-br from-zinc-950/60 via-zinc-950/40 to-zinc-950/80 pt-4 md:grid-cols-3">
            <FeatureItem
              icon={<Cpu className="h-4 w-4 text-emerald-300/90" aria-hidden />}
              title="Camada de Apresentação"
              desc="Next.js App Router + React 19"
              content="A UI é composta por Server Components que orquestram dados e Client Components interativos (ComplaintItem, RageMap, CompanyDashboard, Relatório). O estado é mantido com hooks React e transições assíncronas para garantir fluidez mesmo sob alta latência."
            />
            <FeatureItem
              icon={<Database className="h-4 w-4 text-cyan-300/90" aria-hidden />}
              title="Serviços e Repositórios"
              desc="Arquitetura em camadas"
              content="Server Actions chamam serviços (`complaintService`, `notificationService`, `companyService`) que encapsulam regras de negócio e delegam persistência a repositórios Mongoose. Cada repositório é responsável por querys otimizadas, índices e agregações específicas de domínio."
            />
            <FeatureItem
              icon={<Lock className="h-4 w-4 text-red-300/90" aria-hidden />}
              title="Autorização e Segurança"
              desc="JWT + Guards por role"
              content="Rotas sensíveis (`/admin`, `/dashboard-empresa`, `/activities`, `/relatorio`) utilizam guards baseados em JWT e roles (`USER`, `COMPANY`, `ADMIN`). Acesso a ações como resposta oficial, alteração de estado ou eliminação de denúncia é sempre validado no servidor antes de tocar na base de dados."
            />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border border-zinc-800/80 bg-zinc-950/40">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-300/90" aria-hidden />
                <CardTitle>Fluxo de Denúncia</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-5 text-zinc-300">
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

          <Card className="border border-zinc-800/80 bg-zinc-950/40">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-red-300/90" aria-hidden />
                <CardTitle>Controlo de Acesso e Auditoria</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-5 text-zinc-300">
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
      </div>
    </div>
  );
}

