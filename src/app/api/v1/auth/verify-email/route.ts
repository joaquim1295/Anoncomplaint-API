import { z } from "zod";
import { jsonData, jsonError } from "../../../../../lib/api/http";
import * as authService from "../../../../../lib/authService";
import { authRegisterLimiter, getClientIp, rateLimitOrNull } from "../../../../../lib/rate-limit";

const schema = z.object({
  token: z.string().min(10).max(200),
});

export async function POST(request: Request) {
  const limited = await rateLimitOrNull(authRegisterLimiter, getClientIp(request), "authRegister");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "JSON inválido", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation_error", "Token inválido", 400, parsed.error.flatten());
  }
  const result = await authService.confirmUserEmailWithToken(parsed.data.token);
  if (!result.success) return jsonError("verify_failed", result.error, 400);
  return jsonData({ ok: true });
}
