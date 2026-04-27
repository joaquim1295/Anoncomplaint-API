import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import * as adminService from "../../lib/adminService";
import { AdminView } from "./view";

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
  status: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  endorsedByCount: number;
  officialResponse: { companyId: string; content: string; createdAt: string } | null;
};

function toIso(d: Date | string | null | undefined): string {
  if (!d) return "";
  return typeof d === "string" ? d : d.toISOString();
}

export default async function AdminPage() {
  const [users, complaints] = await Promise.all([
    adminService.getAllUsers(),
    adminService.getAllComplaints(),
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
    status: String(c.status),
    content: c.content,
    tags: c.tags ?? [],
    created_at: toIso(c.created_at),
    updated_at: toIso(c.updated_at),
    endorsedByCount: (c.endorsedBy ?? []).length,
    officialResponse: c.officialResponse
      ? {
          companyId: c.officialResponse.companyId,
          content: c.officialResponse.content,
          createdAt: toIso(c.officialResponse.createdAt),
        }
      : null,
  }));

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/70 pb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-200 ring-cyber transition hover:bg-zinc-900/45 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4 text-red-300/90" aria-hidden />
            <span>AnonComplaint</span>
          </Link>
          <h1 className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-100">
            <Shield className="h-4 w-4 text-red-300/90" aria-hidden />
            <span>Backoffice</span>
          </h1>
        </header>

        <AdminView users={userRows} complaints={complaintRows} />
      </div>
    </div>
  );
}
