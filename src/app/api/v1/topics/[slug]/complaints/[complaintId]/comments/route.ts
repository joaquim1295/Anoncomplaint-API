import { requireApiAuth } from "../../../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../../../lib/api/http";
import * as topicComplaintCommentService from "../../../../../../../../lib/topicComplaintCommentService";

const DEFAULT_LIMIT = 15;

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string; complaintId: string }> }
) {
  const { slug, complaintId } = await context.params;
  const topicSlug = String(slug ?? "").trim().toLowerCase();
  const id = String(complaintId ?? "").trim();
  if (!id || !/^[a-f0-9]{24}$/i.test(id)) {
    return jsonError("validation_error", "ID de denúncia inválido.", 400);
  }
  const url = new URL(request.url);
  const before = (url.searchParams.get("before") ?? "").trim();
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT));
  const result = before
    ? await topicComplaintCommentService.getOlderTopicComments(topicSlug, id, before, limit)
    : await topicComplaintCommentService.getTopicCommentsForComplaint(topicSlug, id, limit);
  if (!result.ok) return jsonError("forbidden", result.error, 400);
  return jsonData(result.data, undefined, { hasOlder: result.hasOlder });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; complaintId: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const { slug, complaintId } = await context.params;
  const topicSlug = String(slug ?? "").trim().toLowerCase();
  const id = String(complaintId ?? "").trim();
  if (!id || !/^[a-f0-9]{24}$/i.test(id)) {
    return jsonError("validation_error", "ID de denúncia inválido.", 400);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "JSON inválido.", 400);
  }
  const content = typeof body === "object" && body && "content" in body ? String((body as { content: unknown }).content ?? "") : "";
  const result = await topicComplaintCommentService.addTopicComplaintComment(topicSlug, id, auth.session.userId, content);
  if (!result.ok) return jsonError("validation_error", result.error, 400);
  return jsonData(result.comment);
}
