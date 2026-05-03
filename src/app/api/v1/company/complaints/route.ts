import { requireApiAuth, requireRole } from "../../../../../lib/api/auth";
import { jsonData, parsePagination } from "../../../../../lib/api/http";
import * as complaintService from "../../../../../lib/complaintService";
import { UserRole } from "../../../../../types/user";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.USER, UserRole.COMPANY, UserRole.ADMIN]);
  if (!role.ok) return role.response;
  const url = new URL(request.url);
  const { page, limit, offset } = parsePagination(url.searchParams);
  const merged = await complaintService.getFeedForOwnedCompaniesDashboard(auth.session.userId, {
    limit: Math.min(200, limit + offset + 20),
  });
  const complaints = merged.slice(offset, offset + limit);
  const hasMore = merged.length > offset + limit;
  return jsonData(complaints, undefined, { page, limit, hasMore });
}

