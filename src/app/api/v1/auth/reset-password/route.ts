import { z } from "zod";
import { jsonData, jsonError } from "../../../../../lib/api/http";
import * as authService from "../../../../../lib/authService";
import { forgotPasswordLimiter, getClientIp, rateLimitOrNull } from "../../../../../lib/rate-limit";

const schema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const limited = await rateLimitOrNull(forgotPasswordLimiter, getClientIp(request), "forgotPassword");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "JSON inválido", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation_error", "Dados inválidos", 400, parsed.error.flatten());
  }
  const result = await authService.resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!result.success) return jsonError("reset_failed", result.error, 400);
  return jsonData({ ok: true });
}
