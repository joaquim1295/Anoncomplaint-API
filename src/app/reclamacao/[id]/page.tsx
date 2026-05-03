import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "../../../lib/getUser";
import * as complaintService from "../../../lib/complaintService";
import { ComplaintDetailView } from "./view";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const complaint = await complaintService.getComplaintByIdForViewer(id, null);
  if (!complaint) {
    return { title: "Denúncia" };
  }
  const title = (complaint.title ?? "").trim() || "Denúncia";
  return {
    title,
    description: complaint.companyName ? `Denúncia sobre ${complaint.companyName}.` : "Denúncia na plataforma SmartComplaint.",
  };
}

export default async function ReclamacaoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fromTopic?: string }>;
}) {
  const [{ id }, user, sp] = await Promise.all([params, getCurrentUser(), searchParams]);
  const rawTopic = typeof sp?.fromTopic === "string" ? sp.fromTopic.trim().toLowerCase() : "";
  const backTopicSlug = rawTopic && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(rawTopic) ? rawTopic : null;
  const viewer = user ? { userId: user.userId, role: user.role } : null;
  const complaint = await complaintService.getComplaintByIdForViewer(id, viewer);
  if (!complaint) notFound();
  const detail = complaintService.formatFeed([complaint])[0];
  return (
    <ComplaintDetailView
      complaint={detail}
      currentUserId={user?.userId ?? null}
      currentUserRole={user?.role ?? null}
      backTopicSlug={backTopicSlug}
    />
  );
}

