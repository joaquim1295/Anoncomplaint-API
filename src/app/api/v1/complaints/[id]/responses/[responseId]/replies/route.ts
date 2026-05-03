import { z } from "zod";
import { requireApiAuth } from "@/lib/api/auth";
import { jsonData, jsonError } from "@/lib/api/http";
import * as complaintService from "@/lib/complaintService";

const schema = z.object({
  content: z.string().trim().min(2).max(1500),
  parentReplyId: z.string().trim().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const { id, responseId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "Invalid JSON body", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation_error", "Invalid payload", 400, parsed.error.flatten());
  }
  const result = await complaintService.addOfficialResponseReply(
    id,
    responseId,
    auth.session.userId,
    auth.session.role,
    parsed.data.content,
    parsed.data.parentReplyId
  );
  if (!result.success) return jsonError("reply_failed", result.error, 400);
  return jsonData({ id, responseId, replied: true });
}

