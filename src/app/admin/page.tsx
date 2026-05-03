import type { Metadata } from "next";
import { PageHeader } from "../../components/layout/PageHeader";
import { getI18n } from "../../lib/i18n/request";
import { getMessage } from "../../lib/i18n/dict";
import * as adminService from "../../lib/adminService";
import { AdminClientIsland } from "./AdminClientIsland";

export type AdminUserRow = {
  id: string;
  email: string;
  username?: string;
  role: string;
  banned_at: string | null;
  created_at: string;
};

export type AdminComplaintRow = {
  id: string;
  author_id: string | null;
  title: string | null;
  companyName: string | null;
  companySlug: string | null;
  status: string;
  content: string;
  attachments: string[];
  locationCity: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  endorsedByCount: number;
  officialResponses: { id: string; companyId: string; companyName: string; companySlug: string | null; content: string; createdAt: string }[];
};

export type AdminCompanyVerificationRow = {
  id: string;
  userId: string;
  email: string;
  companyName: string;
  companyWebsite: string;
  contactName: string;
  status: string;
  expiresAt: string;
  emailVerifiedAt: string | null;
  created_at: string;
};

function toIso(d: Date | string | null | undefined): string {
  if (!d) return "";
  return typeof d === "string" ? d : d.toISOString();
}

export default async function AdminPage() {
  const [{ messages }, users, complaints, companyRequests] = await Promise.all([
    getI18n(),
    adminService.getAllUsers(),
    adminService.getAllComplaints(),
    adminService.getPendingCompanyVerificationRequests(),
  ]);

  const userRows: AdminUserRow[] = users.map((u) => ({
    id: String(u._id),
    email: u.email,
    username: u.username,
    role: String(u.role ?? "user"),
    banned_at: u.banned_at ? toIso(u.banned_at) : null,
    created_at: toIso(u.created_at),
  }));

  const complaintRows: AdminComplaintRow[] = complaints.map((c) => ({
    id: String(c._id),
    author_id: c.author_id ?? null,
    title: c.title ?? null,
    companyName: c.companyName ?? null,
    companySlug: c.companySlug ?? null,
    status: String(c.status),
    content: c.content,
    attachments: c.attachments ?? [],
    locationCity: c.location?.city ?? null,
    tags: c.tags ?? [],
    created_at: toIso(c.created_at),
    updated_at: toIso(c.updated_at),
    endorsedByCount: (c.endorsedBy ?? []).length,
    officialResponses: (c.officialResponses ?? []).map((response) => ({
      id: response.id,
      companyId: response.companyId,
      companyName: response.companyName,
      companySlug: response.companySlug ?? null,
      content: response.content,
      createdAt: toIso(response.createdAt),
    })),
  }));

  const companyVerificationRows: AdminCompanyVerificationRow[] = companyRequests.map((r) => ({
    id: String(r._id),
    userId: r.userId,
    email: r.email,
    companyName: r.companyName,
    companyWebsite: r.companyWebsite,
    contactName: r.contactName,
    status: r.status,
    expiresAt: toIso(r.expiresAt),
    emailVerifiedAt: r.emailVerifiedAt ? toIso(r.emailVerifiedAt) : null,
    created_at: toIso(r.created_at),
  }));

  const tr = (key: string) => getMessage(messages, key);

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <PageHeader title={tr("admin.panelTitle")} iconName="shield" variant="sticky" tone="admin" />

        <AdminClientIsland users={userRows} complaints={complaintRows} companyRequests={companyVerificationRows} />
      </div>
    </div>
  );
}
