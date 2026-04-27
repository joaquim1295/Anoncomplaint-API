import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "anon_session";
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "default-jwt-secret-min-32-chars"
);
const JWT_ISSUER = "anon-complaint";
const JWT_AUDIENCE = "anon-complaint";

const PRIVATE_PATHS = ["/activities", "/perfil"];
const API_PREFIX = "/api/v1";
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN ?? "*")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function resolveCorsOrigin(originHeader: string | null): string {
  if (CORS_ORIGINS.includes("*")) return "*";
  if (!originHeader) return CORS_ORIGINS[0] ?? "*";
  return CORS_ORIGINS.includes(originHeader) ? originHeader : CORS_ORIGINS[0] ?? "*";
}

function applyCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = resolveCorsOrigin(request.headers.get("origin"));
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Authorization,Content-Type,Accept");
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.set("Vary", "Origin");
  return response;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith(API_PREFIX)) {
    if (request.method === "OPTIONS") {
      return applyCorsHeaders(new NextResponse(null, { status: 204 }), request);
    }
    return applyCorsHeaders(NextResponse.next(), request);
  }

  if (!isPrivatePath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/api/v1/:path*",
    "/activities",
    "/activities/:path*",
    "/perfil",
    "/perfil/:path*",
  ],
};
