import { cookies } from "next/headers";
import { z } from "zod";
import * as authService from "../../../../../lib/authService";
import { jsonData, jsonError } from "../../../../../lib/api/http";
import { authLoginLimiter, getClientIp, rateLimitOrNull } from "../../../../../lib/rate-limit";

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "anon_session";
const MAX_AGE = 60 * 60 * 24 * 7;

const schema = z.object({
  emailOrUsername: z.string().trim().min(1),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  const limited = await rateLimitOrNull(authLoginLimiter, getClientIp(request), "authLogin");
  if (limited) return limited;

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
  const result = await authService.login(parsed.data.emailOrUsername, parsed.data.password);
  if (!result.success) {
    return jsonError("login_failed", result.error, 401);
  }
  const token = await authService.generateJWT(String(result.user._id), result.user.role ?? "user");
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
  return jsonData({
    token,
    user: {
      id: String(result.user._id),
      email: result.user.email,
      username: result.user.username ?? null,
      role: result.user.role ?? "user",
    },
  });
}
