"use client";

import Link from "next/link";
import { Building2, Calendar, MapPin, User2 } from "lucide-react";
import type { ComplaintDisplay } from "../../types/complaint";
import { Card, CardContent } from "../ui/Card";

function slugifyName(name: string): string {
  return String(name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function PublicComplaintCard({ complaint }: { complaint: ComplaintDisplay }) {
  const canShowAuthorProfile = complaint.author_label !== "Anónimo" && Boolean(complaint.author_id);
  const companyHref =
    complaint.companySlug ? `/empresa/${complaint.companySlug}` : complaint.companyName ? `/empresa/${slugifyName(complaint.companyName)}` : null;
  const dateLabel =
    complaint.created_at_label ??
    new Date(complaint.created_at).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/30 px-2 py-1 ring-1 ring-inset ring-zinc-800/70">
            <Calendar className="h-3.5 w-3.5 text-emerald-300/80" />
            <span className="tabular-nums">{dateLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/30 px-2 py-1 ring-1 ring-inset ring-zinc-800/70">
            <User2 className="h-3.5 w-3.5 text-emerald-300/70" />
            {canShowAuthorProfile ? (
              <Link href={`/u/${complaint.author_id}`} className="truncate max-w-[180px] underline-offset-2 hover:underline">
                {complaint.author_label}
              </Link>
            ) : (
              <span className="truncate max-w-[180px]">{complaint.author_label}</span>
            )}
          </span>
          {companyHref && complaint.companyName ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/30 px-2 py-1 ring-1 ring-inset ring-zinc-800/70">
              <Building2 className="h-3.5 w-3.5 text-emerald-300/70" />
              <Link href={companyHref} className="truncate max-w-[180px] underline-offset-2 hover:underline">
                {complaint.companyName}
              </Link>
            </span>
          ) : null}
          {complaint.location?.city ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950/30 px-2 py-1 ring-1 ring-inset ring-zinc-800/70">
              <MapPin className="h-3.5 w-3.5 text-red-300/80" />
              <span className="truncate max-w-[160px]">{complaint.location.city}</span>
            </span>
          ) : null}
          <span className="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold tracking-wide ring-1 ring-inset bg-zinc-900/40 text-zinc-200 ring-zinc-800/70">
            {complaint.status}
          </span>
        </div>
        <p className="mb-4 text-sm leading-6 text-zinc-100">
          {complaint.ai_summary || "Resumo IA indisponível para esta denúncia."}
        </p>
        <Link
          href={`/reclamacao/${complaint.id}`}
          className="inline-flex h-9 items-center rounded-xl border border-zinc-700 bg-zinc-950/40 px-3 text-xs font-medium text-zinc-200 transition hover:bg-zinc-900/60"
        >
          Ver Detalhes
        </Link>
      </CardContent>
    </Card>
  );
}

