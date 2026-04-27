"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { ComplaintDisplay } from "../../types/complaint";
import { ComplaintStatus } from "../../types/complaint";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

export function CompanyComplaintManager({ complaints }: { complaints: ComplaintDisplay[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleUpdateStatus(id: string, status: ComplaintStatus) {
    startTransition(async () => {
      const response = await fetch(`/api/v1/company/complaints/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.error?.message ?? "Não foi possível atualizar o estado.");
      } else {
        toast.success("Estado atualizado.");
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-200">
          <AlertCircle className="h-4 w-4 text-emerald-300/90" aria-hidden />
          <span>Denúncias sob gestão</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {complaints.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-300">
            Ainda não existem denúncias associadas às respostas desta empresa.
          </p>
        ) : (
          <div className="space-y-4">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl bg-zinc-950/35 p-4 ring-1 ring-inset ring-zinc-800/80"
              >
                <div className="mb-2 flex items-center justify-between gap-3 text-xs text-zinc-400">
                  <span className="tabular-nums">{c.created_at_label}</span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold tracking-wide ring-1 ring-inset",
                      c.status === ComplaintStatus.RESOLVED
                        ? "bg-emerald-500/10 text-emerald-200 ring-emerald-500/40"
                        : c.status === ComplaintStatus.ARCHIVED
                        ? "bg-zinc-800/70 text-zinc-200 ring-zinc-600/70"
                        : "bg-amber-500/10 text-amber-200 ring-amber-500/40"
                    )}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="mb-3 text-sm leading-6 text-zinc-100">{c.content}</p>
                {c.officialResponse && c.officialResponse.content && (
                  <div className="mb-3 rounded-xl bg-emerald-950/10 p-3 ring-1 ring-inset ring-emerald-500/30">
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-emerald-200">
                      <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden />
                      <span>Resposta oficial</span>
                    </div>
                    <p className="text-xs leading-5 text-emerald-100">
                      {c.officialResponse.content}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={isPending || c.status === ComplaintStatus.RESOLVED}
                    onClick={() => handleUpdateStatus(c.id, ComplaintStatus.RESOLVED)}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden />
                    <span>Marcar como resolvida</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending || c.status === ComplaintStatus.ARCHIVED}
                    onClick={() => handleUpdateStatus(c.id, ComplaintStatus.ARCHIVED)}
                  >
                    <XCircle className="h-4 w-4 text-zinc-300" aria-hidden />
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
