import { z } from "zod";
import { requireApiAuth } from "../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../lib/api/http";
import * as authService from "../../../../../../lib/authService";
import { UserRole } from "../../../../../../types/user";

const schema = z.object({
  role: z.literal(UserRole.COMPANY),
});

export async function PATCH(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "Invalid JSON body", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation_error", "Invalid payload", 400, parsed.error.flatten());
  }
  const result = await authService.updateRoleToCompany(auth.session.userId);
  if (!result.success) return jsonError("update_failed", result.error, 400);
  return jsonData({
    id: String(result.user._id),
    role: result.user.role ?? UserRole.USER,
  });
}

