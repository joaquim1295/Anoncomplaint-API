import { requireApiAuth, requireRole } from "../../../../../lib/api/auth";
import { jsonData } from "../../../../../lib/api/http";
import * as adminService from "../../../../../lib/adminService";
import { UserRole } from "../../../../../types/user";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.ADMIN]);
  if (!role.ok) return role.response;
  const users = await adminService.getAllUsers();
  return jsonData(
    users.map((u) => ({
      id: String(u._id),
      email: u.email,
      username: u.username ?? null,
      role: u.role ?? UserRole.USER,
      banned_at: u.banned_at ?? null,
      created_at: u.created_at,
    }))
  );
}

