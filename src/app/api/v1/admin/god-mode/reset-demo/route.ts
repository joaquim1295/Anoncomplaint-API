import { requireApiAuth, requireRole } from "@/lib/api/auth";
import { jsonData, jsonError } from "@/lib/api/http";
import * as adminService from "@/lib/adminService";
import { logAudit } from "@/lib/logger";
import { UserRole } from "@/types/user";

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.ADMIN]);
  if (!role.ok) return role.response;
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_GOD_MODE_RESET !== "1") {
    return jsonError("forbidden", "Reset de demo desativado em produção (ALLOW_GOD_MODE_RESET).", 403);
  }
  logAudit("info", "god_mode_reset_demo", { adminUserId: auth.session.userId });
  const result = await adminService.resetDemoData();
  return jsonData({ reset: true, deleted: result.deleted });
}

