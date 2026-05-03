import crypto from "crypto";
import { z } from "zod";
import { jsonData, jsonError } from "../../../../../lib/api/http";
import * as userRepository from "../../../../../lib/repositories/userRepository";
import { sendPasswordResetEmail } from "../../../../../lib/services/email-service";
import { forgotPasswordLimiter, getClientIp, rateLimitOrNull } from "../../../../../lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
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
    return jsonError("validation_error", "Email inválido", 400, parsed.error.flatten());
  }
  const user = await userRepository.findByEmail(parsed.data.email.trim().toLowerCase());
  if (user && !user.banned_at && !user.deleted_at) {
    const token = crypto.randomBytes(32).toString("hex");
    await userRepository.updateById(String(user._id), {
      password_reset_token: token,
      password_reset_expires: new Date(Date.now() + 60 * 60 * 1000),
    });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl: `${baseUrl}/redefinir-password?token=${encodeURIComponent(token)}`,
    });
  }
  return jsonData({ ok: true });
}
