"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { AdminComplaintRow, AdminCompanyVerificationRow, AdminUserRow } from "./page";
import { cn } from "../../lib/utils";
import { useI18n } from "../../components/providers/I18nProvider";

type DialogState =
  | { open: false }
  | {
      open: true;
      kind: "banUser" | "forceDeleteComplaint" | "approveCompanyUnverified";
      id: string;
      title: string;
      description: string;
      confirmLabel: string;
      /** Se false, botão de confirmação usa estilo primário (ex.: aprovar empresa). */
      confirmDestructive?: boolean;
    };

function formatIso(iso: string | null, localeTag: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(localeTag, { dateStyle: "medium", timeStyle: "short" });
}

function short(text: string, max = 120): string {
  const t = String(text ?? "");
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "…";
}

function slugifyName(name: string): string {
  return String(name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminView({
  users,
  complaints,
  companyRequests,
}: {
  users: AdminUserRow[];
  complaints: AdminComplaintRow[];
  companyRequests: AdminCompanyVerificationRow[];
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const dateLocaleTag = locale === "en" ? "en-GB" : locale === "es" ? "es" : "pt-PT";
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [complaintQuery, setComplaintQuery] = useState("");
  const [showUsers, setShowUsers] = useState(true);
  const [showComplaints, setShowComplaints] = useState(true);
  const [showCompanyRequests, setShowCompanyRequests] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaintRow | null>(null);
  const [attachmentDrafts, setAttachmentDrafts] = useState<string[]>([]);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");

  const usersSorted = useMemo(() => {
    return [...users].sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
  }, [users]);

  const complaintsSorted = useMemo(() => {
    return [...complaints]
      .filter((c) => {
        const q = complaintQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          (c.title ?? "").toLowerCase().includes(q) ||
          (c.content ?? "").toLowerCase().includes(q) ||
          (c.companyName ?? "").toLowerCase().includes(q) ||
          (c.locationCity ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
  }, [complaints, complaintQuery]);
  const companyRequestsSorted = useMemo(() => {
    return [...companyRequests].sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
  }, [companyRequests]);

  function closeDialog() {
    setDialog({ open: false });
  }

  function openBanUser(u: AdminUserRow) {
    setDialog({
      open: true,
      kind: "banUser",
      id: u.id,
      title: t("admin.banUserTitle"),
      description: t("admin.banUserDesc").replace("{{email}}", u.email),
      confirmLabel: t("admin.confirmBan"),
      confirmDestructive: true,
    });
  }

  function openForceDeleteComplaint(c: AdminComplaintRow) {
    setDialog({
      open: true,
      kind: "forceDeleteComplaint",
      id: c.id,
      title: t("admin.deleteComplaintTitle"),
      description: t("admin.deleteComplaintDesc"),
      confirmLabel: t("admin.confirmDelete"),
      confirmDestructive: true,
    });
  }

  function openApproveCompanyWithoutEmail(r: AdminCompanyVerificationRow) {
    setDialog({
      open: true,
      kind: "approveCompanyUnverified",
      id: r.id,
      title: t("admin.approveCompanyNoEmailTitle"),
      description: t("admin.approveCompanyNoEmailDesc")
        .replace("{{company}}", r.companyName)
        .replace("{{email}}", r.email),
      confirmLabel: t("admin.confirmApproveWithoutEmail"),
      confirmDestructive: false,
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
          if (!response.ok) {
            const res = await response.json().catch(() => null);
            toast.error(res?.error?.message ?? t("admin.toastBanFail"));
            return;
          }
          toast.success(t("admin.toastBanned"));
        } else if (dialog.kind === "forceDeleteComplaint") {
          const response = await fetch(`/api/v1/admin/complaints/${dialog.id}`, {
            method: "DELETE",
            credentials: "include",
          });
          const res = await response.json().catch(() => null);
          if (!response.ok) {
            toast.error(res?.error?.message ?? t("admin.toastDeleteFail"));
            return;
          }
          toast.success(t("admin.toastDeleted"));
        } else if (dialog.kind === "approveCompanyUnverified") {
          const response = await fetch(`/api/v1/admin/company-requests/${dialog.id}/approve`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ approveWithoutEmailVerification: true }),
          });
          const res = await response.json().catch(() => null);
          if (!response.ok) {
            toast.error(res?.error?.message ?? t("admin.toastApproveFail"));
            return;
          }
          toast.success(t("admin.toastApproved"));
          toast.warning(t("admin.toastApprovedPendingEmail"));
        }
        closeDialog();
        router.refresh();
      } catch {
        toast.error(t("admin.toastUnexpected"));
      }
    });
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("file_read_failed"));
      reader.readAsDataURL(file);
    });
  }

  function openComplaintModal(c: AdminComplaintRow) {
    setSelectedComplaint(c);
    setAttachmentDrafts(c.attachments ?? []);
    setNewAttachmentUrl("");
  }

  function saveAttachments() {
    if (!selectedComplaint) return;
    startTransition(async () => {
      const response = await fetch(`/api/v1/admin/complaints/${selectedComplaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ attachments: attachmentDrafts }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.error?.message ?? t("admin.toastAttachmentsFail"));
        return;
      }
      toast.success(t("admin.toastAttachmentsOk"));
      router.refresh();
    });
  }

  function approveCompanyRequest(r: AdminCompanyVerificationRow) {
    if (r.status === "pending") {
      openApproveCompanyWithoutEmail(r);
      return;
    }
    startTransition(async () => {
      try {
        const response = await fetch(`/api/v1/admin/company-requests/${r.id}/approve`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approveWithoutEmailVerification: false }),
        });
        const res = await response.json().catch(() => null);
        if (!response.ok) {
          toast.error(res?.error?.message ?? t("admin.toastApproveFail"));
          return;
        }
        toast.success(t("admin.toastApproved"));
        router.refresh();
      } catch {
        toast.error(t("admin.toastUnexpected"));
      }
    });
  }

  function rejectCompanyRequest(id: string) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/v1/admin/company-requests/${id}/reject`, {
          method: "POST",
          credentials: "include",
        });
        const res = await response.json().catch(() => null);
        if (!response.ok) {
          toast.error(res?.error?.message ?? t("admin.toastRejectFail"));
          return;
        }
        toast.success(t("admin.toastRejected"));
        router.refresh();
      } catch {
        toast.error(t("admin.toastUnexpected"));
      }
    });
  }

  return (
    <div className="space-y-5">
      <Tabs.Root defaultValue="users" className="w-full">
        <Tabs.List className="inline-flex flex-wrap items-center gap-2 rounded-2xl bg-zinc-100/90 p-2 ring-1 ring-inset ring-zinc-200/90 dark:bg-zinc-950/25 dark:ring-zinc-800/70">
          <Tabs.Trigger
            value="users"
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-600 ring-cyber transition dark:text-zinc-300",
              "data-[state=active]:bg-red-500/12 data-[state=active]:text-red-900 data-[state=active]:ring-1 data-[state=active]:ring-inset data-[state=active]:ring-red-500/30",
              "dark:data-[state=active]:text-red-100"
            )}
          >
            {t("admin.tabUsers")}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="complaints"
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-600 ring-cyber transition dark:text-zinc-300",
              "data-[state=active]:bg-red-500/12 data-[state=active]:text-red-900 data-[state=active]:ring-1 data-[state=active]:ring-inset data-[state=active]:ring-red-500/30",
              "dark:data-[state=active]:text-red-100"
            )}
          >
            {t("admin.tabComplaints")}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="company-requests"
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-600 ring-cyber transition dark:text-zinc-300",
              "data-[state=active]:bg-red-500/12 data-[state=active]:text-red-900 data-[state=active]:ring-1 data-[state=active]:ring-inset data-[state=active]:ring-red-500/30",
              "dark:data-[state=active]:text-red-100"
            )}
          >
            {t("admin.tabCompanyRequests")}
          </Tabs.Trigger>
        </Tabs.List>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            value={complaintQuery}
            onChange={(e) => setComplaintQuery(e.target.value)}
            placeholder={t("admin.searchComplaintsPlaceholder")}
          />
          <Button type="button" variant="outline" onClick={() => setShowUsers((v) => !v)}>
            {showUsers ? t("admin.hideUsers") : t("admin.showUsers")}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowComplaints((v) => !v)}>
            {showComplaints ? t("admin.hideComplaints") : t("admin.showComplaints")}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowCompanyRequests((v) => !v)}>
            {showCompanyRequests ? t("admin.hideRequests") : t("admin.showRequests")}
          </Button>
        </div>

        <Tabs.Content value="users" className="mt-4">
          {!showUsers ? null : (
          <div className="overflow-hidden rounded-2xl bg-zinc-50/90 ring-1 ring-inset ring-zinc-200/80 dark:bg-zinc-950/20 dark:ring-zinc-800/70">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-zinc-100/95 dark:bg-zinc-950/35">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colEmail")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colUsername")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colRole")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colCreated")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colSuspended")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colActions")}
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
                          idx % 2 === 0 ? "bg-white/80 dark:bg-zinc-950/10" : "bg-zinc-50/90 dark:bg-zinc-950/20",
                          "border-t border-zinc-200/80 dark:border-zinc-800/60"
                        )}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                          <Link href={`/u/${u.id}`} className="underline-offset-2 hover:underline">
                            {u.email}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                          <Link href={`/u/${u.id}`} className="underline-offset-2 hover:underline">
                            {u.username ?? t("admin.dash")}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{u.role}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-400">{formatIso(u.created_at, dateLocaleTag)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-400">
                          {banned ? formatIso(u.banned_at, dateLocaleTag) : t("admin.dash")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={pending || banned}
                              onClick={() => openBanUser(u)}
                            >
                              {t("admin.ban")}
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
          )}
        </Tabs.Content>

        <Tabs.Content value="complaints" className="mt-4">
          {!showComplaints ? null : (
          <div className="overflow-hidden rounded-2xl bg-zinc-50/90 ring-1 ring-inset ring-zinc-200/80 dark:bg-zinc-950/20 dark:ring-zinc-800/70">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-zinc-100/95 dark:bg-zinc-950/35">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colId")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colAuthor")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colCompany")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colStatus")}
                    </th>
                    <th className="min-w-[360px] px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colContent")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colImages")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colTags")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colCreated")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colUpdated")}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {t("admin.colActions")}
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
                          idx % 2 === 0 ? "bg-white/80 dark:bg-zinc-950/10" : "bg-zinc-50/90 dark:bg-zinc-950/20",
                          "border-t border-zinc-200/80 dark:border-zinc-800/60"
                        )}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">{c.id}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                          {c.author_id ? (
                            <Link href={`/u/${c.author_id}`} className="underline-offset-2 hover:underline text-zinc-800 dark:text-zinc-200">
                              {c.author_id}
                            </Link>
                          ) : (
                            t("admin.dash")
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                          {c.companyName ? (
                            <Link href={`/empresa/${c.companySlug ?? slugifyName(c.companyName)}`} className="underline-offset-2 hover:underline text-zinc-800 dark:text-zinc-200">
                              {c.companyName}
                            </Link>
                          ) : c.officialResponses.length > 0 ? (
                            c.officialResponses.slice(0, 2).map((r, i) => (
                              <span key={`${r.id}-${i}`} className="mr-2 inline-flex">
                                {r.companyName ? (
                                  <Link href={`/empresa/${r.companySlug ?? slugifyName(r.companyName)}`} className="underline-offset-2 hover:underline text-zinc-800 dark:text-zinc-200">
                                    {r.companyName}
                                  </Link>
                                ) : (
                                  <span className="text-zinc-700 dark:text-zinc-300">{r.companyName}</span>
                                )}
                              </span>
                            ))
                          ) : (
                            t("admin.dash")
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-700 dark:text-zinc-300">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold tracking-wide ring-1 ring-inset",
                              c.status === "pending_review"
                                ? "bg-red-500/12 text-red-100 ring-red-500/30"
                                : "bg-zinc-200/80 text-zinc-800 ring-zinc-300/90 dark:bg-zinc-900/40 dark:text-zinc-200 dark:ring-zinc-800/70"
                            )}
                          >
                            {c.status}
                          </span>
                          {isRedacted ? (
                            <span className="ml-2 inline-flex items-center rounded-full bg-zinc-200/80 px-2 py-1 text-[11px] font-semibold tracking-wide text-zinc-800 ring-1 ring-inset ring-zinc-300/90 dark:bg-zinc-900/40 dark:text-zinc-200 dark:ring-zinc-800/70">
                              {t("admin.redactedBadge")}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200">{short(c.content, 180)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">{c.attachments.length}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                          {c.tags.length ? c.tags.slice(0, 4).join(", ") : t("admin.dash")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">{formatIso(c.created_at, dateLocaleTag)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">{formatIso(c.updated_at, dateLocaleTag)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={pending}
                              onClick={() => openComplaintModal(c)}
                            >
                              <Eye className="h-4 w-4" />
                              {t("admin.viewComplaint")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={pending}
                              onClick={() => openForceDeleteComplaint(c)}
                            >
                              {t("admin.forceDelete")}
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
          )}
        </Tabs.Content>

        <Tabs.Content value="company-requests" className="mt-4">
          {!showCompanyRequests ? null : (
          <div className="overflow-hidden rounded-2xl bg-zinc-50/90 ring-1 ring-inset ring-zinc-200/80 dark:bg-zinc-950/20 dark:ring-zinc-800/70">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-zinc-100/95 dark:bg-zinc-950/35">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">{t("admin.colCompany")}</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">{t("admin.colWebsite")}</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">{t("admin.colCorpEmail")}</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">{t("admin.colContact")}</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">{t("admin.colStatus")}</th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">{t("admin.colExpires")}</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">{t("admin.colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {companyRequestsSorted.map((r, idx) => {
                    const canApprove = r.status === "email_verified" || r.status === "pending";
                    return (
                      <tr
                        key={r.id}
                        className={cn(
                          idx % 2 === 0 ? "bg-white/80 dark:bg-zinc-950/10" : "bg-zinc-50/90 dark:bg-zinc-950/20",
                          "border-t border-zinc-200/80 dark:border-zinc-800/60"
                        )}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                          <Link href={`/?company_name=${encodeURIComponent(r.companyName)}`} className="underline-offset-2 hover:underline">
                            {r.companyName}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{r.companyWebsite}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                          <Link href={`/u/${r.userId}`} className="underline-offset-2 hover:underline">
                            {r.email}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{r.contactName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{r.status}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">{formatIso(r.expiresAt, dateLocaleTag)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={pending || !canApprove}
                              onClick={() => approveCompanyRequest(r)}
                            >
                              {t("admin.approve")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={pending || r.status === "approved" || r.status === "rejected"}
                              onClick={() => rejectCompanyRequest(r.id)}
                            >
                              {t("admin.reject")}
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
          )}
        </Tabs.Content>
      </Tabs.Root>

      <Dialog.Root open={dialog.open} onOpenChange={(o) => (o ? null : closeDialog())}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200/90 bg-white/95 p-6 text-zinc-900 shadow-2xl ring-1 ring-inset ring-zinc-200/80 backdrop-blur data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 dark:border-transparent dark:bg-zinc-950/70 dark:text-zinc-100 dark:ring-zinc-800/80">
            <div className="space-y-3">
              <Dialog.Title className="text-base font-semibold leading-6 tracking-tight text-zinc-900 dark:text-zinc-100">
                {dialog.open ? dialog.title : ""}
              </Dialog.Title>
              <Dialog.Description className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {dialog.open ? dialog.description : ""}
              </Dialog.Description>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Dialog.Close asChild>
                  <Button variant="secondary" disabled={pending}>
                    {t("admin.cancelDialog")}
                  </Button>
                </Dialog.Close>
                <Button
                  variant={dialog.open && dialog.confirmDestructive === false ? "default" : "destructive"}
                  disabled={pending}
                  onClick={confirm}
                >
                  {dialog.open ? dialog.confirmLabel : t("admin.dialogConfirmDefault")}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={Boolean(selectedComplaint)} onOpenChange={(open) => (open ? null : setSelectedComplaint(null))}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200/90 bg-white/95 p-6 text-zinc-900 shadow-2xl ring-1 ring-inset ring-zinc-200/80 backdrop-blur dark:border-transparent dark:bg-zinc-950/70 dark:text-zinc-100 dark:ring-zinc-800/80">
            <Dialog.Title className="text-base font-semibold leading-6 tracking-tight text-zinc-900 dark:text-zinc-100">
              {selectedComplaint?.title ?? t("admin.complaintFallbackTitle")}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {selectedComplaint?.companyName ?? t("admin.noCompany")} - {selectedComplaint?.locationCity ?? t("admin.noCity")} - {selectedComplaint?.status}
            </Dialog.Description>
            <div className="mt-4 space-y-3">
              <p className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-100">{selectedComplaint?.content}</p>
              {(selectedComplaint?.attachments ?? []).length > 0 && (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {attachmentDrafts.map((img, idx) => (
                    <div key={`${selectedComplaint?.id}-img-${idx}`} className="relative overflow-hidden rounded-lg ring-1 ring-zinc-300/90 dark:ring-zinc-800/80">
                      <a href={img} target="_blank" rel="noreferrer">
                        <img src={img} alt={t("admin.attachmentAlt").replace("{{n}}", String(idx + 1))} className="h-24 w-full object-cover" />
                      </a>
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded bg-zinc-900/85 px-1 text-xs text-white dark:bg-zinc-950/80"
                        aria-label={t("admin.removeAttachmentAria").replace("{{n}}", String(idx + 1))}
                        onClick={() => setAttachmentDrafts((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("admin.attachmentsHelp")}</p>
                <div className="flex gap-2">
                  <Input
                    value={newAttachmentUrl}
                    onChange={(e) => setNewAttachmentUrl(e.target.value)}
                    placeholder={t("admin.placeholderImageUrl")}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const url = newAttachmentUrl.trim();
                      if (!url) return;
                      setAttachmentDrafts((prev) => [...prev, url].slice(0, 8));
                      setNewAttachmentUrl("");
                    }}
                  >
                    {t("admin.addUrlButton")}
                  </Button>
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const base64 = await fileToBase64(file);
                    setAttachmentDrafts((prev) => [...prev, base64].slice(0, 8));
                    e.currentTarget.value = "";
                  }}
                />
                <Button onClick={saveAttachments} disabled={pending}>
                  {t("admin.saveAttachments")}
                </Button>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Dialog.Close asChild>
                <Button variant="secondary">{t("admin.close")}</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
