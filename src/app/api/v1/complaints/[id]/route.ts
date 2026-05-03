import { z } from "zod";
import { getApiSession, requireApiAuth } from "../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../lib/api/http";
import * as complaintService from "../../../../../lib/complaintService";
import { formatFeed } from "../../../../../lib/complaintService";

const patchSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    content: z.string().min(10).max(2000).optional(),
  })
  .refine((v) => v.title !== undefined || v.content !== undefined, {
    message: "Envie title e/ou content",
  });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getApiSession(request);
  const viewer = session ? { userId: session.userId, role: session.role } : null;
  const complaint = await complaintService.getComplaintByIdForViewer(id, viewer);
  if (!complaint) return jsonError("not_found", "Denúncia não encontrada", 404);
  return jsonData(formatFeed([complaint])[0]);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "JSON inválido", 400);
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation_error", "Payload inválido", 400, parsed.error.flatten());
  }
  const { id } = await params;
  const result = await complaintService.patchComplaintByAuthor(id, auth.session.userId, parsed.data);
  if (!result.success) return jsonError("update_failed", result.error, 400);
  return jsonData(formatFeed([result.complaint])[0]);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const result = await complaintService.deleteComplaint(id, auth.session.userId);
  if (!result.success) return jsonError("delete_failed", result.error, 400);
  return jsonData({ id, deleted: true });
}
