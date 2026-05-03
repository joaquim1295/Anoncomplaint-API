import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "anon_session";

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  throw new Error("FATAL ERROR: JWT_SECRET is missing or too short in Middleware.");
}
const SECRET = new TextEncoder().encode(rawSecret);

const JWT_ISSUER = "anon-complaint";
const JWT_AUDIENCE = "anon-complaint";

const PRIVATE_PATHS = [
  "/activities",
  "/atividade",
  "/perfil",
  "/inbox",
  "/notificacoes",
  "/dashboard-empresa",
  "/admin",
  "/analytics",
];

/** Rotas só para utilizadores com role `admin` (além de autenticação). */
const ADMIN_ONLY_PATHS = ["/relatorio"];
const API_PREFIX = "/api/v1";
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN ?? "*")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

const UI_HIDE_NAV_HEADER = "x-ui-hide-nav";

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function requiresAuth(pathname: string): boolean {
  return isPrivatePath(pathname) || isAdminOnlyPath(pathname);
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

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(UI_HIDE_NAV_HEADER, "1");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (pathname.startsWith(API_PREFIX)) {
    if (request.method === "OPTIONS") {
      return applyCorsHeaders(new NextResponse(null, { status: 204 }), request);
    }
    return applyCorsHeaders(NextResponse.next(), request);
  }

  if (!requiresAuth(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const role = typeof payload.role === "string" ? payload.role : "user";
    if (isAdminOnlyPath(pathname) && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/v1/:path*",
    "/login",
    "/login/:path*",
    "/activities",
    "/activities/:path*",
    "/atividade",
    "/atividade/:path*",
    "/perfil",
    "/perfil/:path*",
    "/inbox",
    "/inbox/:path*",
    "/notificacoes",
    "/notificacoes/:path*",
    "/dashboard-empresa",
    "/dashboard-empresa/:path*",
    "/admin",
    "/admin/:path*",
    "/analytics",
    "/analytics/:path*",
    "/relatorio",
    "/relatorio/:path*",
  ],
};
