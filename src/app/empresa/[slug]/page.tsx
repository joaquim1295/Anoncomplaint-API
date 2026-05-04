import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "../../../lib/getUser";
import * as companyService from "../../../lib/companyService";
import * as complaintService from "../../../lib/complaintService";
import * as analyticsService from "../../../lib/services/analytics";
import { getI18n } from "../../../lib/i18n/request";
import { getMessage } from "../../../lib/i18n/dict";
import { EmpresaView, type EmpresaTab } from "./view";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ slug }, { messages }] = await Promise.all([params, getI18n()]);
  const fbTitle = getMessage(messages, "meta.empresaPublic.fallbackTitle");
  const descTpl = getMessage(messages, "meta.empresaPublic.descriptionTemplate");
  const company = await companyService.getBySlug(slug);
  if (!company) {
    return { title: fbTitle };
  }
  return {
    title: company.name,
    description: descTpl.replace("{{name}}", company.name),
  };
}

function maskAuthor(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed.toLowerCase() === "anónimo") return "Anónimo";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "";
  const secondInitial = (parts[1]?.charAt(0) ?? "").toUpperCase();
  return secondInitial ? `${first} ${secondInitial}.` : first;
}

export default async function EmpresaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    tab?: string;
    q?: string;
    status?: string;
    city?: string;
  }>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  const rawTab = (search.tab as EmpresaTab) || "latest";
  const tab: EmpresaTab = ["latest", "unanswered", "responded"].includes(rawTab)
    ? rawTab
    : "latest";
  const q = (search.q ?? "").trim();
  const status = (search.status ?? "").trim();
  const city = (search.city ?? "").trim();

  const [company, currentUser] = await Promise.all([
    companyService.getBySlug(slug),
    getCurrentUser(),
  ]);

  if (!company) notFound();

  const [complaints, reputation, performance] = await Promise.all([
    complaintService.getFeedByCompanyId(company.id, {
      tab,
      q: q || undefined,
      city: city || undefined,
      status: status || undefined,
      limit: 100,
      offset: 0,
    }),
    companyService.calculateReputation(company.id),
    analyticsService.getCompanyPerformance(company.id),
  ]);

  const isOwner = currentUser?.userId === company.ownerUserId;
  const isAdmin = currentUser?.role === "admin";
  const canSeeUnmasked = Boolean(isOwner || isAdmin);

  const complaintRows = complaints.map((complaint) => ({
    ...complaint,
    author_label: canSeeUnmasked
      ? complaint.author_label
      : complaint.ghost_mode
      ? "Anónimo"
      : maskAuthor(complaint.author_label),
  }));

  return (
    <EmpresaView
      company={company}
      complaints={complaintRows}
      reputation={reputation}
      initialTab={tab}
      initialQ={q}
      initialStatus={status}
      initialCity={city}
      isOwner={Boolean(isOwner)}
      isAdmin={Boolean(isAdmin)}
      performance={performance}
      complaintUserId={currentUser?.userId ?? null}
    />
  );
}

