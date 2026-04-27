"use client";

import { useMemo, useState, useTransition } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/Button";
import type { AdminComplaintRow, AdminUserRow } from "./page";
import { cn } from "../../lib/utils";

type DialogState =
  | { open: false }
  | {
      open: true;
      kind: "banUser" | "forceDeleteComplaint";
      id: string;
      title: string;
      description: string;
      confirmLabel: string;
    };

function formatIso(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" });
}

function short(text: string, max = 120): string {
  const t = String(text ?? "");
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "…";
}

export function AdminView({
  users,
  complaints,
}: {
  users: AdminUserRow[];
  complaints: AdminComplaintRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<DialogState>({ open: false });

  const usersSorted = useMemo(() => {
    return [...users].sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
  }, [users]);

  const complaintsSorted = useMemo(() => {
    return [...complaints].sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
  }, [complaints]);

  function closeDialog() {
    setDialog({ open: false });
  }

  function openBanUser(u: AdminUserRow) {
    setDialog({
      open: true,
      kind: "banUser",
      id: u.id,
      title: "Banir utilizador",
      description: `Isto vai suspender o acesso de ${u.email}.`,
      confirmLabel: "Confirmar ban",
    });
  }

  function openForceDeleteComplaint(c: AdminComplaintRow) {
    setDialog({
      open: true,
      kind: "forceDeleteComplaint",
      id: c.id,
      title: "Eliminar denúncia",
      description: "Isto vai apagar definitivamente esta denúncia.",
      confirmLabel: "Confirmar eliminação",
    });
  }

  function confirm() {
    if (!dialog.open) return;
    startTransition(async () => {
      try {
        if (dialog.kind === "banUser") {
          const response = await fetch(`/api/v1/admin/users/${dialog.id}/ban`, {
            method: "POST",
            credentials: "include",
          });
          const res = await response.json().catch(() => null);
          if (!response.ok) {
            toast.error(res?.error?.message ?? "Não foi possível banir utilizador.");
            return;
          }
          toast.success("Utilizador banido");
        } else {
          const response = await fetch(`/api/v1/admin/complaints/${dialog.id}`, {
            method: "DELETE",
            credentials: "include",
          });
          const res = await response.json().catch(() => null);
          if (!response.ok) {
            toast.error(res?.error?.message ?? "Não foi possível eliminar denúncia.");
            return;
          }
          toast.success("Denúncia eliminada");
        }
        closeDialog();
        router.refresh();
      } catch {
        toast.error("Erro inesperado");
      }
    });
  }

  return (
    <div className="space-y-5">
      <Tabs.Root defaultValue="users" className="w-full">
        <Tabs.List className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950/25 p-2 ring-1 ring-inset ring-zinc-800/70">
          <Tabs.Trigger
            value="users"
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-300 ring-cyber transition",
              "data-[state=active]:bg-red-500/12 data-[state=active]:text-red-100 data-[state=active]:ring-1 data-[state=active]:ring-inset data-[state=active]:ring-red-500/30"
            )}
          >
            Utilizadores
          </Tabs.Trigger>
          <Tabs.Trigger
            value="complaints"
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-300 ring-cyber transition",
              "data-[state=active]:bg-red-500/12 data-[state=active]:text-red-100 data-[state=active]:ring-1 data-[state=active]:ring-inset data-[state=active]:ring-red-500/30"
            )}
          >
            Denúncias
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="users" className="mt-4">
          <div className="overflow-hidden rounded-2xl bg-zinc-950/20 ring-1 ring-inset ring-zinc-800/70">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-zinc-950/35">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-300">
                      Email
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-300">
                      Username
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-300">
                      Role
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-300">
                      Criado
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-300">
                      Suspenso
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold tracking-wide text-zinc-300">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usersSorted.map((u, idx) => {
                    const banned = Boolean(u.banned_at);
                    return (
                      <tr
                        key={u.id}
                        className={cn(
                          idx % 2 === 0 ? "bg-zinc-950/10" : "bg-zinc-950/20",
                          "border-t border-zinc-800/60"
                        )}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-100">{u.email}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-300">{u.username ?? "-"}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-300">{u.role}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-400">{formatIso(u.created_at)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-400">
                          {banned ? formatIso(u.banned_at) : "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={pending || banned}
                              onClick={() => openBanUser(u)}
                            >
                              Banir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="complaints" className="mt-4">
          <div className="overflow-hidden rounded-2xl bg-zinc-950/20 ring-1 ring-inset ring-zinc-800/70">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-zinc-950/35">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-300">
                      ID
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-300">
                      Autor
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-300">
                      Status
                    </th>
                    <th className="min-w-[360px] px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-300">
                      Conteúdo
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-300">
                      Tags
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-300">
                      Criado
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-300">
                      Atualizado
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold tracking-wide text-zinc-300">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {complaintsSorted.map((c, idx) => {
                    const isRedacted = c.content === "[Redacted]";
                    return (
                      <tr
                        key={c.id}
                        className={cn(
                          idx % 2 === 0 ? "bg-zinc-950/10" : "bg-zinc-950/20",
                          "border-t border-zinc-800/60"
                        )}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-400">{c.id}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-400">{c.author_id ?? "-"}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-300">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold tracking-wide ring-1 ring-inset",
                              c.status === "pending_review"
                                ? "bg-red-500/12 text-red-100 ring-red-500/30"
                                : "bg-zinc-900/40 text-zinc-200 ring-zinc-800/70"
                            )}
                          >
                            {c.status}
                          </span>
                          {isRedacted ? (
                            <span className="ml-2 inline-flex items-center rounded-full bg-zinc-900/40 px-2 py-1 text-[11px] font-semibold tracking-wide text-zinc-200 ring-1 ring-inset ring-zinc-800/70">
                              redacted
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-200">{short(c.content, 180)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-400">
                          {c.tags.length ? c.tags.slice(0, 4).join(", ") : "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-400">{formatIso(c.created_at)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-400">{formatIso(c.updated_at)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={pending}
                              onClick={() => openForceDeleteComplaint(c)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <Dialog.Root open={dialog.open} onOpenChange={(o) => (o ? null : closeDialog())}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-zinc-950/70 p-6 text-zinc-100 ring-1 ring-inset ring-zinc-800/80 shadow-2xl backdrop-blur data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <div className="space-y-3">
              <Dialog.Title className="text-base font-semibold leading-6 tracking-tight text-zinc-100">
                {dialog.open ? dialog.title : ""}
              </Dialog.Title>
              <Dialog.Description className="text-sm leading-6 text-zinc-300">
                {dialog.open ? dialog.description : ""}
              </Dialog.Description>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Dialog.Close asChild>
                  <Button variant="secondary" disabled={pending}>
                    Cancelar
                  </Button>
                </Dialog.Close>
                <Button variant="destructive" disabled={pending} onClick={confirm}>
                  {dialog.open ? dialog.confirmLabel : "Confirmar"}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
