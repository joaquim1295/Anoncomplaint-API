import { requireApiAuth, requireRole } from "../../../../../lib/api/auth";
import { jsonData, parsePagination } from "../../../../../lib/api/http";
import * as complaintService from "../../../../../lib/complaintService";
import { UserRole } from "../../../../../types/user";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.COMPANY]);
  if (!role.ok) return role.response;
  const url = new URL(request.url);
  const { page, limit, offset } = parsePagination(url.searchParams);
  const complaints = await complaintService.getFeedByCompanyUserId(auth.session.userId, {
    limit,
    offset,
  });
  const hasMore = complaints.length === limit;
  return jsonData(complaints, undefined, { page, limit, hasMore });
}

