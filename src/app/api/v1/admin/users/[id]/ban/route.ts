import { requireApiAuth, requireRole } from "../../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../../lib/api/http";
import * as adminService from "../../../../../../../lib/adminService";
import { UserRole } from "../../../../../../../types/user";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.ADMIN]);
  if (!role.ok) return role.response;
  const { id } = await params;
  const user = await adminService.banUser(id);
  if (!user) return jsonError("not_found", "User not found", 404);
  return jsonData({ id, banned: true, banned_at: user.banned_at ?? null });
}

