"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  complaintId: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificacoesView({ notifications }: { notifications: NotificationItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleMarkAsRead(id: string) {
    startTransition(async () => {
      const response = await fetch(`/api/v1/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.error?.message ?? "Não foi possível marcar como lida.");
      } else {
        toast.success("Notificação marcada como lida.");
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-4">
      {notifications.length === 0 ? (
        <div className="rounded-2xl bg-zinc-950/25 p-6 ring-1 ring-inset ring-zinc-800/70">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-emerald-300/90" aria-hidden />
            <p className="text-sm leading-6 text-zinc-300">
              Ainda não tem notificações.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => {
            const created = new Date(n.createdAt);
            const timeLabel = created.toLocaleString("pt-PT", {
              dateStyle: "short",
              timeStyle: "short",
            });
            return (
              <li
                key={n.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border px-4 py-3",
                  n.isRead
                    ? "border-zinc-800/70 bg-zinc-950/25"
                    : "border-emerald-500/40 bg-zinc-950/40"
                )}
              >
                <div className="mt-1">
                  {n.isRead ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400/80" aria-hidden />
                  ) : (
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold tracking-tight text-zinc-100">
                      {n.title}
                    </p>
                    <span className="text-xs text-zinc-500 tabular-nums">{timeLabel}</span>
                  </div>
                  <p className="text-sm leading-6 text-zinc-300">{n.message}</p>
                </div>
                {!n.isRead && (
                  <div className="ml-2 flex items-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 rounded-xl px-3 text-xs"
                      onClick={() => handleMarkAsRead(n.id)}
                      disabled={isPending}
                    >
                      <span>Marcar como lida</span>
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
