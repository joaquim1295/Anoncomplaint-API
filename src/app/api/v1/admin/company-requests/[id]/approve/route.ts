import { requireApiAuth, requireRole } from "../../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../../lib/api/http";
import * as adminService from "../../../../../../../lib/adminService";
import { getAppLocale } from "../../../../../../../lib/i18n/server";
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
  const locale = await getAppLocale();
  const result = await adminService.approveCompanyVerificationRequest(id, auth.session.userId, { locale });
  if (!result.success) return jsonError("approve_failed", result.error, 400);
  return jsonData({ id, approved: true, userId: result.userId });
}

