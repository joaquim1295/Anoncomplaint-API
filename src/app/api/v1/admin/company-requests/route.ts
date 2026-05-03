import { requireApiAuth, requireRole } from "../../../../../lib/api/auth";
import { jsonData } from "../../../../../lib/api/http";
import * as adminService from "../../../../../lib/adminService";
import { UserRole } from "../../../../../types/user";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.ADMIN]);
  if (!role.ok) return role.response;
  const requests = await adminService.getPendingCompanyVerificationRequests();
  return jsonData(
    requests.map((r) => ({
      id: String(r._id),
      userId: r.userId,
      email: r.email,
      companyName: r.companyName,
      companyWebsite: r.companyWebsite,
      contactName: r.contactName,
      status: r.status,
      expiresAt: r.expiresAt,
      emailVerifiedAt: r.emailVerifiedAt ?? null,
      created_at: r.created_at,
    }))
  );
}

