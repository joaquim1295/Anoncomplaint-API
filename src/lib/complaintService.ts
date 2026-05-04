import { revalidateTag, unstable_cache } from "next/cache";
import * as complaintRepository from "./repositories/complaintRepository";
import * as companyRepository from "./repositories/companyRepository";
import * as userRepository from "./repositories/userRepository";
import type { ComplaintDocument } from "../models/Complaint";
import type { ComplaintDisplay } from "../types/complaint";
import { ComplaintStatus } from "../types/complaint";
import { createComplaintSchema, formatZodIssuesForClient } from "./validations";
import type { CreateComplaintInput } from "./validations";
import { isCloudinaryConfigured, isDataImageUri, uploadDataUriImage } from "./media/cloudinary";
import { generatePrivateSummary, isContentToxic } from "./moderationService";
import { notifyComplaintUpdate, notifyTopicNewComplaint } from "./services/notification-service";
import * as topicRepository from "./repositories/topicRepository";
import * as topicService from "./topicService";
import { triggerRealtimeEvent } from "./realtime/pusher-server";
import { UserRole } from "../types/user";

const ANON_LABEL = "Anónimo" as const;
const REGISTERED_LABEL = "Autor registado" as const;

const COMPLAINT_AGGREGATE_TAG = "complaint-aggregate" as const;
const STATS_CACHE_SECONDS = 120;

export function invalidateComplaintAggregateCaches() {
  try {
    revalidateTag(COMPLAINT_AGGREGATE_TAG);
  } catch {
    /* Sem store de cache (ex.: Jest, scripts). */
  }
}

async function normalizeAttachmentsForCreate(
  raw: string[]
): Promise<{ ok: true; attachments: string[] } | { ok: false; error: string }> {
  const list = (raw ?? []).slice(0, 4).map((s) => String(s ?? "").trim()).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < list.length; i++) {
    const s = list[i]!;
    if (!isDataImageUri(s)) {
      out.push(s);
      continue;
    }
    if (!isCloudinaryConfigured()) {
      out.push(s);
      continue;
    }
    try {
      out.push(await uploadDataUriImage(s, "complaints"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        ok: false,
        error: `Anexo #${i + 1} (imagem): ${msg}. Se CLOUDINARY_URL estiver como https://..., usa cloudinary://API_KEY:API_SECRET@CLOUD_NAME ou remove CLOUDINARY_URL e define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.`,
      };
    }
  }
  return { ok: true, attachments: out };
}

export async function createComplaint(
  input: unknown,
  userId: string | null
): Promise<
  | { success: true; complaint: ComplaintDocument; flagged?: boolean }
  | { success: false; error: string; details?: unknown }
> {
  const parsed = createComplaintSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: formatZodIssuesForClient(parsed.error.issues),
      details: { issues: parsed.error.issues, formErrors: parsed.error.flatten().fieldErrors },
    };
  }
  const {
    title,
    company_id,
    content,
    tags,
    ghost_mode,
    location_city,
    location_lat,
    location_lng,
    topic_slug,
  } = parsed.data as CreateComplaintInput;

  const attNorm = await normalizeAttachmentsForCreate(parsed.data.attachments ?? []);
  if (!attNorm.ok) {
    return { success: false, error: attNorm.error };
  }
  const attachments = attNorm.attachments;

  const author_id = userId;

  try {
    const combined = [title, content, ...(tags ?? [])].join(" ");
    const [toxic, aiSummary] = await Promise.all([isContentToxic(combined), generatePrivateSummary(content)]);
    const status = toxic ? ComplaintStatus.PENDING_REVIEW : ComplaintStatus.PENDING;
    const city = (location_city ?? "").trim();
    const location =
      city && typeof location_lat === "number" && typeof location_lng === "number"
        ? { city, lat: location_lat, lng: location_lng }
        : null;
    let companyId: string | null = null;
    let companyName: string | null = null;
    let companySlug: string | null = null;
    if (company_id) {
      const company = await companyRepository.findById(company_id);
      if (company) {
        companyId = String(company._id);
        companyName = company.name;
        companySlug = company.slug;
      }
    }
    const normalizedTags = [...(tags ?? [])];

    let topicSlugOut: string | null = null;
    let topicTitleOut: string | null = null;
    if (topic_slug) {
      const topicDoc = await topicService.ensureTopicExists(topic_slug);
      topicSlugOut = topicDoc.slug;
      topicTitleOut = topicDoc.title;
      const hashTag = `#${topicSlugOut}`;
      if (!normalizedTags.some((t) => t.toLowerCase() === hashTag.toLowerCase())) {
        normalizedTags.push(hashTag);
      }
    }

    const complaint = await complaintRepository.create({
      author_id,
      ghost_mode: Boolean(ghost_mode),
      title,
      companyId,
      companyName,
      companySlug,
      content,
      attachments,
      ai_summary: aiSummary,
      tags: normalizedTags,
      topic_slug: topicSlugOut,
      topic_title: topicTitleOut,
      status,
      location,
    });
    if (topicSlugOut) {
      await topicRepository.incrementComplaintCount(topicSlugOut);
      void notifyTopicNewComplaint({
        topicSlug: topicSlugOut,
        topicTitle: topicTitleOut ?? topicSlugOut,
        complaintId: String(complaint._id),
        complaintTitle: title,
        excludeUserId: author_id,
      });
    }
    const complaintId = String(complaint._id);
    await triggerRealtimeEvent("complaints-feed", "complaint-updated", {
      complaintId,
      type: "created",
      topicSlug: topicSlugOut,
    });
    await triggerRealtimeEvent("public-feed", "new-interaction", {
      complaintId,
      companyName: companyName?.trim() || title.trim().slice(0, 80) || "Denúncia",
      content: title.trim().slice(0, 140),
      createdAt: new Date().toISOString(),
    });
    invalidateComplaintAggregateCaches();
    return { success: true, complaint, flagged: toxic };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      success: false,
      error: `Falha ao criar denúncia (servidor): ${msg}`,
      details:
        process.env.NODE_ENV !== "production" && e instanceof Error
          ? { stack: e.stack, name: e.name }
          : undefined,
    };
  }
}

/** Tags só para indexação (ex.: ObjectId da empresa) não devem aparecer na UI — já existe `companyId`. */
function tagsForPublicDisplay(tags: string[] | undefined, companyId: string | null | undefined): string[] {
  return (tags ?? []).filter((t) => {
    const s = String(t).trim();
    if (!s) return false;
    if (companyId && s === companyId) return false;
    if (/^[a-f0-9]{24}$/i.test(s)) return false;
    return true;
  });
}

function toDisplay(doc: ComplaintDocument): ComplaintDisplay {
  const withAuthor = doc as ComplaintDocument & {
    author?: {
      email?: string;
      username?: string;
    };
  };
  let author_label: string;
  if (doc.ghost_mode) {
    author_label = ANON_LABEL;
  } else if (doc.author_id == null) {
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
  const officialResponses = (doc.officialResponses ?? []).map((r) => ({
    id: r.id,
    companyId: r.companyId,
    companyOwnerUserId: r.companyOwnerUserId,
    companyName: r.companyName,
    companySlug: r.companySlug ?? null,
    content: r.content,
    createdAt: r.createdAt,
    createdAt_label: new Date(r.createdAt).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }),
    replies: (r.replies ?? []).map((reply) => ({
      id: reply.id,
      authorUserId: reply.authorUserId,
      authorLabel: reply.authorLabel,
      content: reply.content,
      parentReplyId: reply.parentReplyId ?? null,
      createdAt: reply.createdAt,
      createdAt_label: new Date(reply.createdAt).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
    })),
  }));
  const location = doc.location
    ? {
        city: doc.location.city,
        lat: doc.location.lat,
        lng: doc.location.lng,
      }
    : null;
  return {
    id: String(doc._id),
    author_id: doc.author_id ?? null,
    title: doc.title ?? null,
    companyId: doc.companyId ?? null,
    companyName: doc.companyName ?? null,
    companySlug: doc.companySlug ?? null,
    content: doc.content,
    attachments: doc.attachments ?? [],
    ai_summary: doc.ai_summary ?? null,
    tags: tagsForPublicDisplay(doc.tags, doc.companyId),
    topic_slug: doc.topic_slug ?? null,
    topic_title: doc.topic_title ?? null,
    status: doc.status,
    ghost_mode: Boolean(doc.ghost_mode),
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    edited_at: doc.edited_at ? new Date(doc.edited_at) : null,
    created_at_label,
    author_label,
    endorsedBy: doc.endorsedBy ?? [],
    officialResponses,
    final_rating: doc.final_rating ?? null,
    location,
  };
}

export function formatFeed(docs: ComplaintDocument[]): ComplaintDisplay[] {
  return docs.map(toDisplay);
}

export async function getComplaintById(complaintId: string): Promise<ComplaintDocument | null> {
  return complaintRepository.findById(complaintId);
}

/** Visibilidade na API pública: `pending_review` só para autor ou admin. */
export async function getComplaintByIdForViewer(
  complaintId: string,
  viewer: { userId: string; role: string } | null
): Promise<ComplaintDocument | null> {
  const doc = await complaintRepository.findById(complaintId);
  if (!doc) return null;
  if (doc.status === ComplaintStatus.PENDING_REVIEW) {
    if (!viewer) return null;
    if (viewer.role === UserRole.ADMIN) return doc;
    if (doc.author_id === viewer.userId) return doc;
    return null;
  }
  return doc;
}

function complaintTargetsCompany(
  doc: ComplaintDocument,
  companyId: string,
  companySlug: string
): boolean {
  if (doc.companyId === companyId) return true;
  if (doc.companySlug && companySlug && doc.companySlug === companySlug) return true;
  return (doc.tags ?? []).includes(companyId);
}

export async function canUserAccessComplaintAiContext(
  complaint: ComplaintDocument,
  userId: string,
  role: string
): Promise<boolean> {
  if (role === UserRole.ADMIN) return true;
  if (complaint.author_id === userId) return true;
  const candidateIds = new Set<string>();
  if (complaint.companyId) candidateIds.add(complaint.companyId);
  for (const tid of complaint.tags ?? []) {
    if (/^[a-f0-9]{24}$/i.test(tid)) candidateIds.add(tid);
  }
  if (!candidateIds.size) return false;
  const companies = await companyRepository.findByIds([...candidateIds]);
  return companies.some((c) => c.ownerUserId === userId);
}

const aiSummaryCache = new Map<string, { summary: string; at: number }>();
const AI_SUMMARY_CACHE_MS = 15 * 60 * 1000;

export async function ensureComplaintAiSummary(
  complaintId: string,
  complaint: ComplaintDocument
): Promise<{ ai_summary: string }> {
  if (complaint.ai_summary) {
    return { ai_summary: complaint.ai_summary };
  }
  const hit = aiSummaryCache.get(complaintId);
  if (hit && Date.now() - hit.at < AI_SUMMARY_CACHE_MS) {
    return { ai_summary: hit.summary };
  }
  let summary: string;
  try {
    const gen = await generatePrivateSummary(complaint.content);
    summary = gen ?? "";
    if (!summary) throw new Error("empty summary");
  } catch {
    const excerpt = complaint.content.trim().slice(0, 400);
    summary =
      excerpt.length > 0
        ? `[Resumo automático indisponível] Primeiras linhas: ${excerpt}${complaint.content.length > 400 ? "…" : ""}`
        : "Resumo indisponível para esta denúncia.";
  }
  aiSummaryCache.set(complaintId, { summary, at: Date.now() });
  await complaintRepository.update(complaintId, { ai_summary: summary });
  return { ai_summary: summary };
}

export async function getRelatedComplaints(
  company: string,
  tags: string[],
  options: { excludeId?: string; limit?: number } = {}
): Promise<ComplaintDisplay[]> {
  const docs = await complaintRepository.findRelated({
    company,
    tags,
    excludeId: options.excludeId,
    limit: options.limit ?? 5,
  });
  return formatFeed(docs);
}

export async function getFeed(options: {
  limit?: number;
  offset?: number;
  status?: ComplaintStatus;
  companyId?: string;
  topic_slug?: string;
  /** Quando definido, lista só denúncias deste autor (ex.: `author=me` na API). */
  authorId?: string;
} = {}): Promise<ComplaintDisplay[]> {
  const docs = await complaintRepository.findWithAuthor({
    limit: options.limit ?? 50,
    offset: options.offset ?? 0,
    status: options.status,
    company_id: options.companyId,
    topic_slug: options.topic_slug,
    author_id: options.authorId,
  });
  return formatFeed(docs);
}

export async function searchComplaints(
  q: string,
  options: { limit?: number; companyId?: string } = {}
): Promise<ComplaintDisplay[]> {
  const docs = await complaintRepository.search({
    q,
    limit: options.limit ?? 30,
    companyId: options.companyId,
  });
  return formatFeed(docs);
}

export async function countByDay(days = 30): Promise<{ date: string; count: number }[]> {
  return complaintRepository.countByDay(days);
}

export type WeeklyTrendItem = import("./repositories/complaintRepository").WeeklyTrendItem;

export async function getWeeklyTrends(): Promise<WeeklyTrendItem[]> {
  try {
    return await unstable_cache(
      () => complaintRepository.getWeeklyTrends(),
      ["complaint-weekly-trends"],
      { revalidate: STATS_CACHE_SECONDS, tags: [COMPLAINT_AGGREGATE_TAG] }
    )();
  } catch {
    return complaintRepository.getWeeklyTrends();
  }
}

export interface RageMeterItem {
  tag: string;
  count: number;
}

export async function getRageMeter(limit = 20): Promise<RageMeterItem[]> {
  try {
    return await unstable_cache(
      async () => {
        const stats = await complaintRepository.aggregate({ tagLimit: limit });
        return stats.by_tag;
      },
      ["complaint-rage-meter", String(limit)],
      { revalidate: STATS_CACHE_SECONDS, tags: [COMPLAINT_AGGREGATE_TAG] }
    )();
  } catch {
    const stats = await complaintRepository.aggregate({ tagLimit: limit });
    return stats.by_tag;
  }
}

export type ComplaintStats = import("./repositories/complaintRepository").ComplaintStats;

export async function getStats(): Promise<ComplaintStats> {
  try {
    return await unstable_cache(
      () => complaintRepository.aggregate(),
      ["complaint-stats-aggregate"],
      { revalidate: STATS_CACHE_SECONDS, tags: [COMPLAINT_AGGREGATE_TAG] }
    )();
  } catch {
    return complaintRepository.aggregate();
  }
}

export async function getPublicFeedPaginated(
  page: number,
  limit: number,
  options?: { companyId?: string; topicSlug?: string }
): Promise<{ complaints: ComplaintDisplay[]; hasMore: boolean }> {
  const { complaints, hasMore } = await complaintRepository.findPublicPaginated(page, limit, options);
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

/** Denúncias ligadas às empresas do utilizador (página pública / tags / respostas oficiais). */
export async function getFeedForOwnedCompaniesDashboard(
  ownerUserId: string,
  options: { limit?: number } = {}
): Promise<ComplaintDisplay[]> {
  const companies = await companyRepository.findByOwner(ownerUserId);
  const maxTotal = options.limit ?? 200;
  if (!companies.length) return [];

  const seen = new Set<string>();
  const merged: ComplaintDocument[] = [];

  const lists = await Promise.all(
    companies.map((company) =>
      complaintRepository.findByCompanyId(String(company._id), { limit: 80, tab: "latest" })
    )
  );
  for (const docs of lists) {
    for (const d of docs) {
      const sid = String(d._id);
      if (!seen.has(sid)) {
        seen.add(sid);
        merged.push(d);
      }
    }
  }

  merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return formatFeed(merged.slice(0, maxTotal));
}

export async function getFeedByCompanyId(
  companyId: string,
  options: {
    limit?: number;
    offset?: number;
    q?: string;
    status?: string;
    city?: string;
    tab?: "latest" | "unanswered" | "responded" | "rated";
  } = {}
): Promise<ComplaintDisplay[]> {
  const docs = await complaintRepository.findByCompanyId(companyId, options);
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
  invalidateComplaintAggregateCaches();
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
  invalidateComplaintAggregateCaches();
  return { success: true, complaint: doc };
}

export async function patchComplaintByAuthor(
  complaintId: string,
  userId: string,
  body: { title?: string; content?: string }
): Promise<{ success: true; complaint: ComplaintDocument } | { success: false; error: string }> {
  const existing = await complaintRepository.findById(complaintId);
  if (!existing) return { success: false, error: "Denúncia não encontrada" };
  if (existing.author_id !== userId) return { success: false, error: "Apenas o autor pode editar." };
  if ((existing.officialResponses ?? []).length > 0) {
    return { success: false, error: "Não é possível editar após resposta oficial." };
  }
  const patch: Partial<
    Pick<ComplaintDocument, "title" | "content" | "edited_at" | "ai_summary">
  > = {
    edited_at: new Date(),
  };
  if (body.title !== undefined) {
    const t = body.title.trim();
    if (t.length < 1 || t.length > 100) return { success: false, error: "Título inválido." };
    patch.title = t;
  }
  if (body.content !== undefined) {
    const c = body.content.trim();
    if (c.length < 10 || c.length > 2000) return { success: false, error: "Conteúdo inválido." };
    patch.content = c;
    patch.ai_summary = null;
  }
  if (body.title === undefined && body.content === undefined) {
    return { success: false, error: "Nada para atualizar." };
  }
  const doc = await complaintRepository.update(complaintId, patch);
  if (!doc) return { success: false, error: "Denúncia não encontrada" };
  invalidateComplaintAggregateCaches();
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
  invalidateComplaintAggregateCaches();
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
  companyId: string,
  content: string,
  options?: { bypassOwnership?: boolean }
): Promise<
  | { success: true; complaint: ComplaintDocument }
  | { success: false; error: string }
> {
  const existing = await complaintRepository.findById(complaintId);
  if (!existing) return { success: false, error: "Denúncia não encontrada" };
  const company = await companyRepository.findById(companyId);
  if (!company || (!options?.bypassOwnership && company.ownerUserId !== companyUserId)) {
    return { success: false, error: "Sem permissão para responder em nome desta empresa" };
  }
  const duplicate = (existing.officialResponses ?? []).some((r) => r.companyId === companyId);
  if (duplicate) {
    return { success: false, error: "Esta empresa já respondeu oficialmente nesta denúncia." };
  }
  if (!complaintTargetsCompany(existing, companyId, company.slug ?? "")) {
    return { success: false, error: "Esta denúncia não está associada à esta empresa." };
  }
  const doc = await complaintRepository.addOfficialResponse(complaintId, {
    id: crypto.randomUUID(),
    companyId,
    companyOwnerUserId: companyUserId,
    companyName: company.name,
    companySlug: company.slug,
    content,
    createdAt: new Date(),
    replies: [],
  });
  if (!doc) return { success: false, error: "Denúncia não encontrada" };
  await notifyComplaintUpdate({
    complaintId,
    status: "official_response",
  });
  await triggerRealtimeEvent("complaints-feed", "complaint-updated", {
    complaintId,
    type: "official_response",
  });
  await triggerRealtimeEvent("public-feed", "new-interaction", {
    complaintId,
    companyName: company.name,
    content: content.slice(0, 140),
    createdAt: new Date().toISOString(),
  });
  invalidateComplaintAggregateCaches();
  return { success: true, complaint: doc };
}

export async function addOfficialResponseReply(
  complaintId: string,
  responseId: string,
  authorUserId: string,
  authorRole: string,
  content: string,
  parentReplyId?: string
): Promise<
  | { success: true; complaint: ComplaintDocument }
  | { success: false; error: string }
> {
  const complaint = await complaintRepository.findById(complaintId);
  if (!complaint) return { success: false, error: "Denúncia não encontrada" };
  const response = (complaint.officialResponses ?? []).find((r) => r.id === responseId);
  if (!response) return { success: false, error: "Resposta oficial não encontrada." };
  const isAdmin = authorRole === UserRole.ADMIN;
  const isAuthor = complaint.author_id === authorUserId;
  if (!isAdmin && !isAuthor) {
    return { success: false, error: "Apenas o autor da denúncia pode submeter réplica/tréplica." };
  }
  const user = await userRepository.findUserById(authorUserId);
  const authorLabel = user?.username || user?.email || "Utilizador";
  const doc = await complaintRepository.addOfficialResponseReply(complaintId, responseId, {
    id: crypto.randomUUID(),
    authorUserId,
    authorLabel,
    content,
    parentReplyId: parentReplyId ?? null,
    createdAt: new Date(),
  });
  if (!doc) return { success: false, error: "Não foi possível adicionar resposta." };
  return { success: true, complaint: doc };
}

/** Réplica + todas as tréplicas que referenciam esta cadeia (parentReplyId). */
function collectDescendantReplyIds(
  replies: { id: string; parentReplyId?: string | null }[],
  rootId: string
): string[] {
  const ids = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of replies) {
      const parent = r.parentReplyId ?? null;
      if (parent && ids.has(parent) && !ids.has(r.id)) {
        ids.add(r.id);
        changed = true;
      }
    }
  }
  return [...ids];
}

export async function patchOfficialResponseReply(
  complaintId: string,
  responseId: string,
  replyId: string,
  userId: string,
  role: string,
  content: string
): Promise<{ success: true; complaint: ComplaintDocument } | { success: false; error: string }> {
  const complaint = await complaintRepository.findById(complaintId);
  if (!complaint) return { success: false, error: "Denúncia não encontrada" };
  const response = (complaint.officialResponses ?? []).find((r) => r.id === responseId);
  if (!response) return { success: false, error: "Resposta oficial não encontrada." };
  const reply = (response.replies ?? []).find((rep) => rep.id === replyId);
  if (!reply) return { success: false, error: "Réplica não encontrada." };
  const isAdmin = role === UserRole.ADMIN;
  if (!isAdmin && reply.authorUserId !== userId) {
    return { success: false, error: "Sem permissão para editar esta réplica." };
  }
  const doc = await complaintRepository.updateOfficialResponseReply(complaintId, responseId, replyId, content);
  if (!doc) return { success: false, error: "Não foi possível atualizar a réplica." };
  return { success: true, complaint: doc };
}

export async function deleteOfficialResponseReply(
  complaintId: string,
  responseId: string,
  replyId: string,
  userId: string,
  role: string
): Promise<{ success: true; complaint: ComplaintDocument } | { success: false; error: string }> {
  const complaint = await complaintRepository.findById(complaintId);
  if (!complaint) return { success: false, error: "Denúncia não encontrada" };
  const response = (complaint.officialResponses ?? []).find((r) => r.id === responseId);
  if (!response) return { success: false, error: "Resposta oficial não encontrada." };
  const reply = (response.replies ?? []).find((rep) => rep.id === replyId);
  if (!reply) return { success: false, error: "Réplica não encontrada." };
  const isAdmin = role === UserRole.ADMIN;
  if (!isAdmin && reply.authorUserId !== userId) {
    return { success: false, error: "Sem permissão para eliminar esta réplica." };
  }
  const toRemove = collectDescendantReplyIds(response.replies ?? [], replyId);
  const doc = await complaintRepository.removeOfficialResponseReplies(complaintId, responseId, toRemove);
  if (!doc) return { success: false, error: "Não foi possível eliminar a réplica." };
  return { success: true, complaint: doc };
}

export async function updateComplaintStatusForCompany(
  complaintId: string,
  companyUserId: string,
  companyId: string,
  newStatus: ComplaintStatus,
  options?: { bypassOwnership?: boolean }
): Promise<
  | { success: true; complaint: ComplaintDocument }
  | { success: false; error: string }
> {
  const existing = await complaintRepository.findById(complaintId);
  if (!existing) return { success: false, error: "Denúncia não encontrada" };
  const company = await companyRepository.findById(companyId);
  if (!company) return { success: false, error: "Empresa não encontrada" };
  if (!complaintTargetsCompany(existing, companyId, company.slug ?? "")) {
    return { success: false, error: "Esta denúncia não está associada à esta empresa." };
  }
  if (!options?.bypassOwnership && company.ownerUserId !== companyUserId) {
    return { success: false, error: "Sem permissão para alterar o estado em nome desta empresa" };
  }
  const hasCompanyResponse = (existing.officialResponses ?? []).some((r) => r.companyId === companyId);
  if (!hasCompanyResponse && !options?.bypassOwnership) {
    return { success: false, error: "Sem permissão para alterar o estado desta denúncia" };
  }
  const doc = await complaintRepository.update(complaintId, { status: newStatus });
  if (!doc) return { success: false, error: "Denúncia não encontrada" };
  await notifyComplaintUpdate({
    complaintId,
    status: newStatus,
  });
  await triggerRealtimeEvent("complaints-feed", "complaint-updated", {
    complaintId,
    type: "status",
    status: newStatus,
  });
  invalidateComplaintAggregateCaches();
  return { success: true, complaint: doc };
}

export async function resolveComplaintByUser(
  complaintId: string,
  userId: string,
  role: string
): Promise<
  | { success: true; complaint: ComplaintDocument }
  | { success: false; error: string }
> {
  const complaint = await complaintRepository.findById(complaintId);
  if (!complaint) return { success: false, error: "Denúncia não encontrada" };
  const isAdmin = role === UserRole.ADMIN;
  const isOwnerUser = role === UserRole.USER && complaint.author_id === userId;
  if (!isAdmin && !isOwnerUser) {
    return { success: false, error: "Apenas o autor pode marcar como resolvida." };
  }
  const updated = await complaintRepository.update(complaintId, { status: ComplaintStatus.RESOLVED });
  if (!updated) return { success: false, error: "Denúncia não encontrada" };
  await triggerRealtimeEvent("complaints-feed", "complaint-updated", {
    complaintId,
    type: "resolved_by_user",
  });
  invalidateComplaintAggregateCaches();
  return { success: true, complaint: updated };
}

export async function setComplaintFinalRating(
  complaintId: string,
  userId: string,
  role: string,
  rating: number
): Promise<
  | { success: true; complaint: ComplaintDocument }
  | { success: false; error: string }
> {
  const complaint = await complaintRepository.findById(complaintId);
  if (!complaint) return { success: false, error: "Denúncia não encontrada" };
  if (complaint.status !== ComplaintStatus.RESOLVED && role !== UserRole.ADMIN) {
    return { success: false, error: "Avaliação só disponível após resolver a denúncia." };
  }
  const isAdmin = role === UserRole.ADMIN;
  const isAuthor = complaint.author_id === userId;
  if (!isAdmin && !isAuthor) {
    return { success: false, error: "Apenas o autor da denúncia pode avaliar." };
  }
  const updated = await complaintRepository.setFinalRating(complaintId, rating);
  if (!updated) return { success: false, error: "Denúncia não encontrada" };
  invalidateComplaintAggregateCaches();
  return { success: true, complaint: updated };
}
