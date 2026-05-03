import { requireApiAuth, requireRole } from "../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../lib/api/http";
import * as adminService from "../../../../../../lib/adminService";
import { UserRole } from "../../../../../../types/user";
import { z } from "zod";

const updateSchema = z.object({
  attachments: z.array(z.string().max(2_000_000)).max(8),
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.ADMIN]);
  if (!role.ok) return role.response;
  const { id } = await params;
  const ok = await adminService.forceDeleteComplaint(id);
  if (!ok) return jsonError("not_found", "Complaint not found", 404);
  return jsonData({ id, deleted: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.ADMIN]);
  if (!role.ok) return role.response;
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "Invalid JSON body", 400);
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation_error", "Invalid payload", 400, parsed.error.flatten());
  }
  const updated = await adminService.updateComplaintAttachments(id, parsed.data.attachments);
  if (!updated) return jsonError("not_found", "Complaint not found", 404);
  return jsonData({
    id: String(updated._id),
    attachments: updated.attachments ?? [],
  });
}

