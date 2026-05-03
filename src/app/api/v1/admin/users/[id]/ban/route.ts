import { requireApiAuth, requireRole } from "../../../../../../../lib/api/auth";
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
  await adminService.banUser(id);
  return new Response(null, { status: 204 });
}

