"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, BadgeCheck, Building2, Gauge, Lock, Sparkles, X } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { Skeleton } from "../ui/Skeleton";
import type { ComplaintDisplay } from "../../types/complaint";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | {
      status: "success";
      summary: { company: string; issue: string; severity: number; tone: string; legalAdvice: string };
      related: ComplaintDisplay[];
    };

export function AiContextModal({
  complaintId,
  open,
  onOpenChange,
}: {
  complaintId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<State>({ status: "idle" });
  const cacheKey = useMemo(() => complaintId, [complaintId]);

  useEffect(() => {
    if (!open) return;
    setState({ status: "loading" });
    startTransition(async () => {
      const response = await fetch(`/api/v1/ai/context/${cacheKey}`, {
        method: "GET",
        credentials: "include",
      });
      const res = await response.json().catch(() => null);
      if (!response.ok) {
        setState({ status: "error", error: res?.error?.message ?? "Erro" });
        return;
      }
      setState({ status: "success", summary: res.data.summary, related: res.data.related });
    });
  }, [open, cacheKey, startTransition]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl bg-zinc-950/70 p-5 text-zinc-100 ring-1 ring-inset ring-zinc-800/80 shadow-2xl backdrop-blur",
            "animate-in slide-in-from-bottom-2 focus:outline-none"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Dialog.Title className="flex items-center gap-2 text-base font-semibold leading-6 tracking-tight text-zinc-100">
                <Sparkles className="h-4 w-4 text-emerald-300/90" aria-hidden />
                <span>Contexto (IA)</span>
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-zinc-400">
                Contexto + denúncias relacionadas
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" aria-label="Fechar">
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </Dialog.Close>
          </div>

          <div className="mt-4 space-y-4">
            {state.status === "loading" && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
                <Skeleton className="h-20" />
                <Skeleton className="h-28" />
              </div>
            )}

            {state.status === "error" && (
              <div className="rounded-2xl bg-zinc-950/25 p-4 ring-1 ring-inset ring-red-500/20">
                <div className="flex items-start gap-2 text-sm leading-6 text-red-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{state.error}</span>
                </div>
              </div>
            )}

            {state.status === "success" && (
              <>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-2xl bg-zinc-950/25 p-3 ring-1 ring-inset ring-zinc-800/70">
                    <div className="flex items-center gap-2 text-xs font-medium tracking-tight text-zinc-400">
                      <Building2 className="h-4 w-4 text-emerald-300/80" aria-hidden />
                      <span>Empresa</span>
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold tracking-tight text-zinc-100" title={state.summary.company}>
                      {state.summary.company}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-zinc-950/25 p-3 ring-1 ring-inset ring-zinc-800/70">
                    <div className="flex items-center gap-2 text-xs font-medium tracking-tight text-zinc-400">
                      <BadgeCheck className="h-4 w-4 text-emerald-300/80" aria-hidden />
                      <span>Issue</span>
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold tracking-tight text-zinc-100" title={state.summary.issue}>
                      {state.summary.issue}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-zinc-950/25 p-3 ring-1 ring-inset ring-zinc-800/70">
                    <div className="flex items-center gap-2 text-xs font-medium tracking-tight text-zinc-400">
                      <Gauge className="h-4 w-4 text-emerald-300/80" aria-hidden />
                      <span>Severidade</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold tracking-tight text-zinc-100 tabular-nums">
                      {state.summary.severity}/10
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-zinc-950/25 p-3 ring-1 ring-inset ring-zinc-800/70">
                    <div className="flex items-center gap-2 text-xs font-medium tracking-tight text-zinc-400">
                      <Sparkles className="h-4 w-4 text-emerald-300/80" aria-hidden />
                      <span>Tom da denúncia</span>
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-100">{state.summary.tone}</div>
                  </div>
                  <div className="rounded-2xl bg-zinc-950/25 p-3 ring-1 ring-inset ring-zinc-800/70">
                    <div className="flex items-center gap-2 text-xs font-medium tracking-tight text-zinc-400">
                      <Lock className="h-4 w-4 text-emerald-300/80" aria-hidden />
                      <span>Conselho legal (informativo)</span>
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-100">{state.summary.legalAdvice}</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-950/25 p-4 ring-1 ring-inset ring-zinc-800/70">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-tight text-zinc-400">
                    <Sparkles className="h-4 w-4 text-emerald-300/80" aria-hidden />
                    <span>Denúncias relacionadas</span>
                    <span className="ml-auto text-zinc-500 tabular-nums">{state.related.length}</span>
                  </div>
                  {state.related.length === 0 ? (
                    <div className="text-sm leading-6 text-zinc-400">Sem resultados.</div>
                  ) : (
                    <ul className="space-y-2">
                      {state.related.slice(0, 5).map((c) => (
                        <li
                          key={c.id}
                          className="rounded-xl bg-zinc-950/30 p-3 ring-1 ring-inset ring-zinc-800/70"
                        >
                          <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
                            <span className="tabular-nums">{c.created_at_label ?? ""}</span>
                            <span className="truncate text-zinc-400">{(c.tags ?? []).slice(0, 3).join(", ")}</span>
                          </div>
                          <div className="mt-1 text-sm leading-6 text-zinc-100">
                            {String(c.content ?? "").slice(0, 160)}
                            {String(c.content ?? "").length > 160 ? "…" : ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="secondary" className="rounded-xl">
                <X className="h-4 w-4" aria-hidden />
                <span>Fechar</span>
              </Button>
            </Dialog.Close>
          </div>

          {isPending && state.status !== "loading" && (
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/0" aria-hidden />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

