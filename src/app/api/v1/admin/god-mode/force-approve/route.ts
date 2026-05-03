import { requireApiAuth, requireRole } from "@/lib/api/auth";
import { jsonData, jsonError } from "@/lib/api/http";
import * as adminService from "@/lib/adminService";
import { UserRole } from "@/types/user";

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.ADMIN]);
  if (!role.ok) return role.response;
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_GOD_MODE !== "1") {
    return jsonError("not_found", "Not found", 404);
  }
  const result = await adminService.forceApproveCurrentUser(auth.session.userId);
  if (!result.success) return jsonError("force_approve_failed", result.error, 400);
  return jsonData({ approved: true, userId: auth.session.userId });
}

