import { cookies } from "next/headers";
import { verifyJWT } from "../authService";
import * as userRepository from "../repositories/userRepository";
import { UserRole } from "../../types/user";
import { jsonError } from "./http";

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "anon_session";

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token;
}

export interface ApiSession {
  userId: string;
  role: string;
}

export async function getApiSession(request: Request): Promise<ApiSession | null> {
  const authHeader = request.headers.get("authorization");
  const bearer = extractBearerToken(authHeader);
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const token = bearer ?? cookieToken;
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload?.userId) return null;

  const user = await userRepository.findUserById(payload.userId);
  if (!user) return null;
  if (user.banned_at) return null;

  return {
    userId: String(user._id),
    role: user.role ?? UserRole.USER,
  };
}

export async function requireApiAuth(request: Request): Promise<
  | { ok: true; session: ApiSession }
  | { ok: false; response: Response }
> {
  const session = await getApiSession(request);
  if (!session) {
    return {
      ok: false,
      response: jsonError("unauthorized", "Authentication required", 401),
    };
  }
  return { ok: true, session };
}

export function requireRole(
  session: ApiSession,
  allowedRoles: string[]
): { ok: true } | { ok: false; response: Response } {
  if (!allowedRoles.includes(session.role)) {
    return {
      ok: false,
      response: jsonError("forbidden", "Insufficient permissions", 403),
    };
  }
  return { ok: true };
}

