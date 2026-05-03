"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, AlertCircle, ShieldCheck, Search } from "lucide-react";
import { toast } from "sonner";
import type { ComplaintDisplay } from "../../types/complaint";
import { ComplaintStatus } from "../../types/complaint";
import type { Company } from "../../types/company";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

function complaintTouchesCompany(c: ComplaintDisplay, companyId: string): boolean {
  if (c.companyId === companyId) return true;
  if ((c.tags ?? []).includes(companyId)) return true;
  if ((c.officialResponses ?? []).some((r) => r.companyId === companyId)) return true;
  return false;
}

function resolveCompanyIdForAction(
  c: ComplaintDisplay,
  owned: Pick<Company, "id">[],
  scope: string
): string | null {
  const ownedSet = new Set(owned.map((x) => x.id));
  if (scope !== "all" && ownedSet.has(scope) && complaintTouchesCompany(c, scope)) return scope;
  if (c.companyId && ownedSet.has(c.companyId)) return c.companyId;
  for (const r of c.officialResponses ?? []) {
    if (ownedSet.has(r.companyId)) return r.companyId;
  }
  if (owned.length === 1) return owned[0].id;
  return null;
}

export function CompanyComplaintManager({
  complaints,
  companies = [],
  companyScope = "all",
}: {
  complaints: ComplaintDisplay[];
  companies?: Pick<Company, "id" | "name">[];
  companyScope?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const qt = q.trim().toLowerCase();
    return complaints.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (!qt) return true;
      const blob = `${c.content ?? ""} ${c.title ?? ""} ${c.companyName ?? ""}`.toLowerCase();
      return blob.includes(qt);
    });
  }, [complaints, statusFilter, q]);

  function handleUpdateStatus(complaint: ComplaintDisplay, status: ComplaintStatus) {
    const companyId = resolveCompanyIdForAction(complaint, companies, companyScope);
    if (!companyId) {
      toast.error("Não foi possível determinar a empresa para esta acção.");
      return;
    }
    startTransition(async () => {
      const response = await fetch(`/api/v1/company/complaints/${complaint.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, company_id: companyId }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.error?.message ?? "Não foi possível atualizar o estado.");
      } else {
        toast.success("Estado actualizado.");
        router.refresh();
      }
    });
  }

  function getSlaMeta(createdAt: Date | string, hasResponse: boolean) {
    if (hasResponse) return null;
    const diffHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      return {
        label: "SLA Verde",
        className:
          "bg-emerald-500/10 text-emerald-900 ring-emerald-500/35 dark:text-emerald-200 dark:ring-emerald-500/40",
        title: "Dentro do SLA",
      };
    }
    if (diffHours < 48) {
      return {
        label: "SLA Amarelo",
        className:
          "bg-amber-500/10 text-amber-900 ring-amber-500/35 dark:text-amber-200 dark:ring-amber-500/40",
        title: "Atenção ao SLA",
      };
    }
    if (diffHours > 72) {
      return {
        label: "SLA Vermelho",
        className: "bg-red-500/10 text-red-900 ring-red-500/35 dark:text-red-200 dark:ring-red-500/40",
        title: "Atraso crítico a afectar reputação",
      };
    }
    return {
      label: "SLA Amarelo",
      className:
        "bg-amber-500/10 text-amber-900 ring-amber-500/35 dark:text-amber-200 dark:ring-amber-500/40",
      title: "Atenção ao SLA",
    };
  }

  const companyLabel =
    companyScope !== "all" ? companies.find((c) => c.id === companyScope)?.name : null;

  return (
    <Card className="border border-zinc-200/90 bg-white/90 dark:border-zinc-800/80 dark:bg-zinc-950/40">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-emerald-900 dark:text-emerald-200">
          <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
          <span>Denúncias sob gestão</span>
          {companyLabel ? (
            <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">({companyLabel})</span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Procurar</span>
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Texto, empresa…"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-100"
              />
            </span>
          </label>
          <label className="flex w-full min-w-[160px] flex-col gap-1.5 sm:max-w-[200px]">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Estado</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-100"
            >
              <option value="">Todos</option>
              <option value={ComplaintStatus.PENDING}>Pendente</option>
              <option value={ComplaintStatus.REVIEWED}>Revista</option>
              <option value={ComplaintStatus.RESOLVED}>Resolvida</option>
              <option value={ComplaintStatus.ARCHIVED}>Encerrada</option>
              <option value={ComplaintStatus.PENDING_REVIEW}>Em revisão</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Nenhuma denúncia corresponde aos filtros ou ainda não há denúncias ligadas às suas empresas.
          </p>
        ) : (
          <div className="space-y-4">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-4 ring-1 ring-inset ring-zinc-200/70 dark:border-zinc-800/70 dark:bg-zinc-950/35 dark:ring-zinc-800/80"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="tabular-nums">{c.created_at_label}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold tracking-wide ring-1 ring-inset",
                        c.status === ComplaintStatus.RESOLVED
                          ? "bg-emerald-500/10 text-emerald-900 ring-emerald-500/35 dark:text-emerald-200 dark:ring-emerald-500/40"
                          : c.status === ComplaintStatus.ARCHIVED
                          ? "bg-zinc-200/90 text-zinc-800 ring-zinc-300/80 dark:bg-zinc-800/70 dark:text-zinc-200 dark:ring-zinc-600/70"
                          : "bg-amber-500/10 text-amber-900 ring-amber-500/35 dark:text-amber-200 dark:ring-amber-500/40"
                      )}
                    >
                      {c.status}
                    </span>
                    {(() => {
                      const meta = getSlaMeta(c.created_at, (c.officialResponses ?? []).length > 0);
                      if (!meta) return null;
                      return (
                        <span
                          title={meta.title}
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold tracking-wide ring-1 ring-inset",
                            meta.className
                          )}
                        >
                          {meta.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                {c.companyName ? (
                  <p className="mb-1 text-xs font-medium text-emerald-800 dark:text-emerald-200">{c.companyName}</p>
                ) : null}
                <p className="mb-3 text-sm leading-6 text-zinc-800 dark:text-zinc-100">{c.content}</p>
                {(c.officialResponses ?? []).map((response) => (
                  <div
                    key={response.id}
                    className="mb-3 rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3 dark:border-emerald-500/25 dark:bg-emerald-950/15"
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-emerald-900 dark:text-emerald-200">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" aria-hidden />
                      <span>Resposta oficial — {response.companyName}</span>
                    </div>
                    <p className="text-xs leading-5 text-emerald-950 dark:text-emerald-100">{response.content}</p>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={isPending || c.status === ComplaintStatus.RESOLVED}
                    onClick={() => handleUpdateStatus(c, ComplaintStatus.RESOLVED)}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" aria-hidden />
                    <span>Marcar como resolvida</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending || c.status === ComplaintStatus.ARCHIVED}
                    onClick={() => handleUpdateStatus(c, ComplaintStatus.ARCHIVED)}
                  >
                    <XCircle className="h-4 w-4 text-zinc-600 dark:text-zinc-300" aria-hidden />
                    <span>Encerrar</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
