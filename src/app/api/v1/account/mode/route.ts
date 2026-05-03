import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../lib/api/http";
import * as companyService from "../../../../../lib/companyService";
import { ACCOUNT_MODE_COOKIE, getResolvedAccountMode } from "../../../../../lib/accountMode";

const bodySchema = z.object({
  mode: z.enum(["personal", "company"]),
});

export async function GET() {
  const ctx = await getResolvedAccountMode();
  if (!ctx.user) {
    return jsonData({ mode: "personal" as const, canCompanyMode: false });
  }
  return jsonData({ mode: ctx.mode, canCompanyMode: ctx.canCompanyMode });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "JSON inválido", 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation_error", "Payload inválido", 400, parsed.error.flatten());
  }

  if (parsed.data.mode === "company") {
    const companies = await companyService.listForUser(auth.session.userId);
    if (!companies.length) {
      return jsonError("forbidden", "Não tem empresas associadas à conta.", 403);
    }
  }

  const res = NextResponse.json({ ok: true, mode: parsed.data.mode });
  res.cookies.set(ACCOUNT_MODE_COOKIE, parsed.data.mode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
