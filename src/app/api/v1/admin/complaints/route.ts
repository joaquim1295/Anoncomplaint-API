import { requireApiAuth, requireRole } from "../../../../../lib/api/auth";
import { jsonData } from "../../../../../lib/api/http";
import * as adminService from "../../../../../lib/adminService";
import { UserRole } from "../../../../../types/user";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.ADMIN]);
  if (!role.ok) return role.response;
  const complaints = await adminService.getAllComplaints();
  return jsonData(
    complaints.map((c) => ({
      id: String(c._id),
      author_id: c.author_id,
      content: c.content,
      status: c.status,
      tags: c.tags ?? [],
      created_at: c.created_at,
      updated_at: c.updated_at,
      officialResponse: c.officialResponse ?? null,
    }))
  );
}

