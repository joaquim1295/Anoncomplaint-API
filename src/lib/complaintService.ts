import * as complaintRepository from "./repositories/complaintRepository";
import type { ComplaintDocument } from "../models/Complaint";
import type { ComplaintDisplay } from "../types/complaint";
import { ComplaintStatus } from "../types/complaint";
import { createComplaintSchema } from "./validations";
import type { CreateComplaintInput } from "./validations";
import { isContentToxic } from "./moderationService";
import { notifyComplaintUpdate } from "./services/notification-service";

const ANON_LABEL = "Anónimo" as const;
const REGISTERED_LABEL = "Autor registado" as const;

export async function createComplaint(
  input: unknown,
  userId: string | null
): Promise<
  | { success: true; complaint: ComplaintDocument; flagged?: boolean }
  | { success: false; error: string }
> {
  const parsed = createComplaintSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0];
    return { success: false, error: msg ?? "Dados inválidos" };
  }
  const { content, tags, ghost_mode, location_city, location_lat, location_lng } = parsed.data as CreateComplaintInput;
  const author_id = ghost_mode ? null : userId;
  const combined = [content, ...(tags ?? [])].join(" ");
  const toxic = isContentToxic(combined);
  const status = toxic ? ComplaintStatus.PENDING_REVIEW : ComplaintStatus.PENDING;
  const city = (location_city ?? "").trim();
  const location =
    city && typeof location_lat === "number" && typeof location_lng === "number"
      ? { city, lat: location_lat, lng: location_lng }
      : null;
  const complaint = await complaintRepository.create({ author_id, content, tags, status, location });
  return { success: true, complaint, flagged: toxic };
}

function toDisplay(doc: ComplaintDocument): ComplaintDisplay {
  const withAuthor = doc as ComplaintDocument & {
    author?: {
      email?: string;
      username?: string;
    };
  };
  let author_label: string;
  if (doc.author_id == null) {
    author_label = ANON_LABEL;
  } else {
    const username = withAuthor.author?.username;
    const email = withAuthor.author?.email;
    author_label = username || email || REGISTERED_LABEL;
  }
  const created = new Date(doc.created_at);
  const created_at_label = created.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const officialResponse = doc.officialResponse
    ? {
        companyId: doc.officialResponse.companyId,
        content: doc.officialResponse.content,
        createdAt: doc.officialResponse.createdAt,
        createdAt_label: new Date(doc.officialResponse.createdAt).toLocaleDateString("pt-PT", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }),
      }
    : undefined;
  const location = doc.location
    ? {
        city: doc.location.city,
        lat: doc.location.lat,
        lng: doc.location.lng,
      }
    : null;
  return {
    id: String(doc._id),
    content: doc.content,
    tags: doc.tags ?? [],
    status: doc.status,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    created_at_label,
    author_label,
    endorsedBy: doc.endorsedBy ?? [],
    officialResponse: officialResponse ?? null,
    location,
  };
}

export function formatFeed(docs: ComplaintDocument[]): ComplaintDisplay[] {
  return docs.map(toDisplay);
}

export async function getFeed(options: {
  limit?: number;
  offset?: number;
  status?: ComplaintStatus;
} = {}): Promise<ComplaintDisplay[]> {
  const docs = await complaintRepository.findWithAuthor({
    limit: options.limit ?? 50,
    offset: options.offset ?? 0,
    status: options.status,
  });
  return formatFeed(docs);
}

export async function searchComplaints(
  q: string,
  options: { limit?: number } = {}
): Promise<ComplaintDisplay[]> {
  const docs = await complaintRepository.search({
    q,
    limit: options.limit ?? 30,
  });
  return formatFeed(docs);
}

export async function countByDay(days = 30): Promise<{ date: string; count: number }[]> {
  return complaintRepository.countByDay(days);
}

export type WeeklyTrendItem = import("./repositories/complaintRepository").WeeklyTrendItem;

export async function getWeeklyTrends(): Promise<WeeklyTrendItem[]> {
  return complaintRepository.getWeeklyTrends();
}

export interface RageMeterItem {
  tag: string;
  count: number;
}

export async function getRageMeter(limit = 20): Promise<RageMeterItem[]> {
  const stats = await complaintRepository.aggregate({ tagLimit: limit });
  return stats.by_tag;
}

export type ComplaintStats = import("./repositories/complaintRepository").ComplaintStats;

export async function getStats(): Promise<ComplaintStats> {
  return complaintRepository.aggregate();
}

export async function getPublicFeedPaginated(
  page: number,
  limit: number
): Promise<{ complaints: ComplaintDisplay[]; hasMore: boolean }> {
  const { complaints, hasMore } = await complaintRepository.findPublicPaginated(page, limit);
  return { complaints: formatFeed(complaints), hasMore };
}

export async function getFeedByUserId(
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<ComplaintDisplay[]> {
  const docs = await complaintRepository.findWithAuthor({
    author_id: userId,
    limit: options.limit,
    offset: options.offset,
  });
  return formatFeed(docs);
}

export async function getFeedByCompanyUserId(
  companyUserId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<ComplaintDisplay[]> {
  const docs = await complaintRepository.findByCompanyUserId(companyUserId, options);
  return formatFeed(docs);
}

export async function resolveComplaint(
  complaintId: string,
  userId: string
): Promise<
  | { success: true; complaint: ComplaintDocument }
  | { success: false; error: string }
> {
  const existing = await complaintRepository.findById(complaintId);
  if (!existing) return { success: false, error: "Denúncia não encontrada" };
  if (existing.author_id === null) return { success: false, error: "Denúncia anónima não pode ser alterada" };
  if (existing.author_id !== userId) return { success: false, error: "Sem permissão para resolver esta denúncia" };
  const doc = await complaintRepository.update(complaintId, {
    status: ComplaintStatus.RESOLVED,
  });
  if (!doc) return { success: false, error: "Denúncia não encontrada" };
  await notifyComplaintUpdate({
    complaintId,
    status: ComplaintStatus.RESOLVED,
  });
  return { success: true, complaint: doc };
}

export async function redact(
  complaintId: string,
  userId: string
): Promise<
  | { success: true; complaint: ComplaintDocument }
  | { success: false; error: string }
> {
  const existing = await complaintRepository.findById(complaintId);
  if (!existing) return { success: false, error: "Denúncia não encontrada" };
  if (existing.author_id === null) return { success: false, error: "Denúncia anónima não pode ser alterada" };
  if (existing.author_id !== userId) return { success: false, error: "Sem permissão para eliminar esta denúncia" };
  const doc = await complaintRepository.redact(complaintId);
  if (!doc) return { success: false, error: "Denúncia não encontrada" };
  return { success: true, complaint: doc };
}

export async function deleteComplaint(
  complaintId: string,
  userId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const existing = await complaintRepository.findById(complaintId);
  if (!existing) return { success: false, error: "Denúncia não encontrada" };
  if (existing.author_id === null) {
    return { success: false, error: "Denúncia anónima não pode ser eliminada" };
  }
  if (existing.author_id !== userId) {
    return { success: false, error: "Sem permissão para eliminar esta denúncia" };
  }
  const ok = await complaintRepository.forceDelete(complaintId);
  if (!ok) return { success: false, error: "Denúncia não encontrada" };
  return { success: true };
}

export async function toggleEndorsement(
  complaintId: string,
  userId: string
): Promise<
  | { success: true; endorsed: boolean; complaint: ComplaintDocument }
  | { success: false; error: string }
> {
  const existing = await complaintRepository.findById(complaintId);
  if (!existing) return { success: false, error: "Denúncia não encontrada" };
  const hasEndorsed = (existing.endorsedBy ?? []).includes(userId);
  const doc = hasEndorsed
    ? await complaintRepository.removeEndorsement(complaintId, userId)
    : await complaintRepository.addEndorsement(complaintId, userId);
  if (!doc) return { success: false, error: "Denúncia não encontrada" };
  return { success: true, endorsed: !hasEndorsed, complaint: doc };
}

export async function addOfficialResponse(
  complaintId: string,
  companyUserId: string,
  content: string
): Promise<
  | { success: true; complaint: ComplaintDocument }
  | { success: false; error: string }
> {
  const existing = await complaintRepository.findById(complaintId);
  if (!existing) return { success: false, error: "Denúncia não encontrada" };
  const doc = await complaintRepository.setOfficialResponse(complaintId, {
    companyId: companyUserId,
    content,
    createdAt: new Date(),
  });
  if (!doc) return { success: false, error: "Denúncia não encontrada" };
  await notifyComplaintUpdate({
    complaintId,
    status: "official_response",
  });
  return { success: true, complaint: doc };
}

export async function updateComplaintStatusForCompany(
  complaintId: string,
  companyUserId: string,
  newStatus: ComplaintStatus
): Promise<
  | { success: true; complaint: ComplaintDocument }
  | { success: false; error: string }
> {
  const existing = await complaintRepository.findById(complaintId);
  if (!existing) return { success: false, error: "Denúncia não encontrada" };
  if (!existing.officialResponse || existing.officialResponse.companyId !== companyUserId) {
    return { success: false, error: "Sem permissão para alterar o estado desta denúncia" };
  }
  const doc = await complaintRepository.update(complaintId, { status: newStatus });
  if (!doc) return { success: false, error: "Denúncia não encontrada" };
  await notifyComplaintUpdate({
    complaintId,
    status: newStatus,
  });
  return { success: true, complaint: doc };
}
