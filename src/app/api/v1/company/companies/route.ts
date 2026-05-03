import { z } from "zod";
import { requireApiAuth, requireRole } from "../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../lib/api/http";
import * as companyService from "../../../../../lib/companyService";
import * as userRepository from "../../../../../lib/repositories/userRepository";
import { UserRole } from "../../../../../types/user";

const schema = z.object({
  name: z.string().min(2).max(160),
  logo_image: z.string().max(2_000_000).optional().nullable(),
  taxId: z.string().max(40).optional().or(z.literal("")).transform((v) => v || undefined),
  website: z.string().url().optional().or(z.literal("")).transform((v) => v || undefined),
  description: z.string().max(600).optional().or(z.literal("")).transform((v) => v || undefined),
});

function normalizeDomain(input: string): string {
  const url = input.startsWith("http://") || input.startsWith("https://") ? input : `https://${input}`;
  return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
}

function getEmailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase().trim() ?? "";
}

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.USER, UserRole.COMPANY, UserRole.ADMIN]);
  if (!role.ok) return role.response;
  const companies = await companyService.listForUser(auth.session.userId);
  return jsonData(companies);
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.USER, UserRole.COMPANY, UserRole.ADMIN]);
  if (!role.ok) return role.response;
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
  const isAdmin = auth.session.role === UserRole.ADMIN;
  if (parsed.data.website && !isAdmin) {
    const user = await userRepository.findUserById(auth.session.userId);
    if (!user) return jsonError("not_found", "User not found", 404);
    const emailDomain = getEmailDomain(user.email);
    let websiteDomain = "";
    try {
      websiteDomain = normalizeDomain(parsed.data.website);
    } catch {
      return jsonError("validation_error", "Website inválido.", 400);
    }
    if (!emailDomain || (!emailDomain.endsWith(websiteDomain) && !websiteDomain.endsWith(emailDomain))) {
      return jsonError("validation_error", "Domínio do website deve corresponder ao domínio do email corporativo.", 400);
    }
  }
  const company = await companyService.createForUser(auth.session.userId, parsed.data);
  return jsonData(company, { status: 201 });
}

