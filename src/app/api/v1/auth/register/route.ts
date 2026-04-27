import { cookies } from "next/headers";
import { z } from "zod";
import * as authService from "../../../../../lib/authService";
import { UserRole } from "../../../../../types/user";
import { jsonData, jsonError } from "../../../../../lib/api/http";

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "anon_session";
const MAX_AGE = 60 * 60 * 24 * 7;

const schema = z.object({
  email: z.string().email(),
  username: z.string().trim().min(1).max(50).optional(),
  password: z.string().min(8).max(128),
  role: z.enum([UserRole.USER, UserRole.COMPANY]).optional(),
});

export async function POST(request: Request) {
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
  const result = await authService.register({
    email: parsed.data.email,
    username: parsed.data.username,
    password: parsed.data.password,
    role: parsed.data.role,
  });
  if (!result.success) {
    return jsonError("register_failed", result.error, 400);
  }
  const token = await authService.generateJWT(String(result.user._id));
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
  return jsonData({
    id: String(result.user._id),
    email: result.user.email,
    username: result.user.username ?? null,
    role: result.user.role ?? UserRole.USER,
  }, { status: 201 });
}

