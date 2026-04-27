import { requireApiAuth, requireRole } from "../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../lib/api/http";
import * as adminService from "../../../../../../lib/adminService";
import { UserRole } from "../../../../../../types/user";

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

