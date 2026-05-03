import { cookies } from "next/headers";
import { z } from "zod";
import { requireApiAuth } from "../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../lib/api/http";
import * as authService from "../../../../../../lib/authService";
import * as userRepository from "../../../../../../lib/repositories/userRepository";
import { accountDeleteLimiter, getClientIp, rateLimitOrNull } from "../../../../../../lib/rate-limit";

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "anon_session";

const schema = z.object({
  confirm: z.literal("DELETE"),
  currentPassword: z.string().min(1).max(128),
});

export async function DELETE(request: Request) {
  const limited = await rateLimitOrNull(accountDeleteLimiter, getClientIp(request), "accountDelete");
  if (limited) return limited;

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
    return jsonError("validation_error", "Confirmação inválida", 400, parsed.error.flatten());
  }

  const passwordOk = await authService.verifyCurrentPassword(auth.session.userId, parsed.data.currentPassword);
  if (!passwordOk) {
    return jsonError("unauthorized", "Password atual incorreta", 401);
  }

  const updated = await userRepository.updateById(auth.session.userId, {
    deleted_at: new Date(),
    public_profile_enabled: false,
  });
  if (!updated) return jsonError("not_found", "Utilizador não encontrado", 404);

  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);

  return jsonData({ success: true });
}
