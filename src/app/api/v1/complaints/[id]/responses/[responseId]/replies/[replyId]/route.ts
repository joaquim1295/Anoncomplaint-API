import { z } from "zod";
import { requireApiAuth } from "@/lib/api/auth";
import { jsonData, jsonError } from "@/lib/api/http";
import * as complaintService from "@/lib/complaintService";

const patchSchema = z.object({
  content: z.string().trim().min(2).max(1500),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; responseId: string; replyId: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const { id, responseId, replyId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "Invalid JSON body", 400);
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation_error", "Invalid payload", 400, parsed.error.flatten());
  }
  const result = await complaintService.patchOfficialResponseReply(
    id,
    responseId,
    replyId,
    auth.session.userId,
    auth.session.role,
    parsed.data.content
  );
  if (!result.success) return jsonError("reply_update_failed", result.error, 400);
  return jsonData({ id, responseId, replyId, updated: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; responseId: string; replyId: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const { id, responseId, replyId } = await params;
  const result = await complaintService.deleteOfficialResponseReply(
    id,
    responseId,
    replyId,
    auth.session.userId,
    auth.session.role
  );
  if (!result.success) return jsonError("reply_delete_failed", result.error, 400);
  return jsonData({ id, responseId, replyId, deleted: true });
}
