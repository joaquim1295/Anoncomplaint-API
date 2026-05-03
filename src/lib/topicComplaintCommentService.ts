import * as complaintRepository from "./repositories/complaintRepository";
import * as topicComplaintCommentRepository from "./repositories/topicComplaintCommentRepository";
import * as userRepository from "./repositories/userRepository";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidTopicSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  return Boolean(s && SLUG_RE.test(s));
}

export async function getTopicCommentsForComplaint(
  topicSlug: string,
  complaintId: string,
  limit: number
): Promise<
  | { ok: true; data: topicComplaintCommentRepository.TopicCommentDto[]; hasOlder: boolean }
  | { ok: false; error: string }
> {
  if (!isValidTopicSlug(topicSlug)) return { ok: false, error: "Slug de tópico inválido." };
  const check = await assertComplaintBelongsToTopic(complaintId, topicSlug.trim().toLowerCase());
  if (!check.ok) return { ok: false, error: check.error };
  const { items, hasOlder } = await topicComplaintCommentRepository.listRecentTopicComments(
    complaintId,
    topicSlug.trim().toLowerCase(),
    limit
  );
  return { ok: true, data: items, hasOlder };
}

export async function getOlderTopicComments(
  topicSlug: string,
  complaintId: string,
  beforeIso: string,
  limit: number
): Promise<
  | { ok: true; data: topicComplaintCommentRepository.TopicCommentDto[]; hasOlder: boolean }
  | { ok: false; error: string }
> {
  if (!isValidTopicSlug(topicSlug)) return { ok: false, error: "Slug de tópico inválido." };
  const before = new Date(beforeIso);
  if (Number.isNaN(before.getTime())) return { ok: false, error: "Data inválida." };
  const check = await assertComplaintBelongsToTopic(complaintId, topicSlug.trim().toLowerCase());
  if (!check.ok) return { ok: false, error: check.error };
  const { items, hasOlder } = await topicComplaintCommentRepository.listOlderTopicComments(
    complaintId,
    topicSlug.trim().toLowerCase(),
    before,
    limit
  );
  return { ok: true, data: items, hasOlder };
}

export async function addTopicComplaintComment(
  topicSlug: string,
  complaintId: string,
  authorUserId: string,
  content: string
): Promise<
  | { ok: true; comment: topicComplaintCommentRepository.TopicCommentDto }
  | { ok: false; error: string }
> {
  const trimmed = content.trim();
  if (trimmed.length < 1) return { ok: false, error: "Escreva uma mensagem." };
  if (trimmed.length > 600) return { ok: false, error: "Mensagem demasiado longa (máx. 600 caracteres)." };
  if (!isValidTopicSlug(topicSlug)) return { ok: false, error: "Slug de tópico inválido." };
  const slug = topicSlug.trim().toLowerCase();
  const check = await assertComplaintBelongsToTopic(complaintId, slug);
  if (!check.ok) return { ok: false, error: check.error };
  const user = await userRepository.findUserById(authorUserId);
  if (!user) return { ok: false, error: "Utilizador não encontrado." };
  const authorLabel =
    (user.username && String(user.username).trim()) ||
    (user.email && String(user.email).trim()) ||
    "Utilizador";
  const comment = await topicComplaintCommentRepository.insertTopicComplaintComment({
    complaintId,
    topicSlug: slug,
    authorUserId,
    authorLabel,
    content: trimmed,
  });
  return { ok: true, comment };
}

async function assertComplaintBelongsToTopic(
  complaintId: string,
  topicSlug: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const complaint = await complaintRepository.findById(complaintId);
  if (!complaint) return { ok: false, error: "Denúncia não encontrada." };
  const t = (complaint.topic_slug ?? "").trim().toLowerCase();
  if (t !== topicSlug) {
    return { ok: false, error: "Esta denúncia não pertence a este tópico." };
  }
  return { ok: true };
}
