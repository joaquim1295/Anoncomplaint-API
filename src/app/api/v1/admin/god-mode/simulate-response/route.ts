import { z } from "zod";
import { requireApiAuth, requireRole } from "@/lib/api/auth";
import { jsonData, jsonError } from "@/lib/api/http";
import * as adminService from "@/lib/adminService";
import { UserRole } from "@/types/user";

const schema = z.object({
  slug: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.ADMIN]);
  if (!role.ok) return role.response;
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {}
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("validation_error", "Payload inválido", 400);
  await adminService.simulateRealtimeResponse(parsed.data.slug);
  return jsonData({ simulated: true });
}

