import { z } from "zod";
import { requireApiAuth, requireRole } from "../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../lib/api/http";
import * as companyService from "../../../../../lib/companyService";
import { UserRole } from "../../../../../types/user";

const schema = z.object({
  name: z.string().min(2).max(160),
  website: z.string().url().optional().or(z.literal("")).transform((v) => v || undefined),
  description: z.string().max(600).optional().or(z.literal("")).transform((v) => v || undefined),
});

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.COMPANY]);
  if (!role.ok) return role.response;
  const companies = await companyService.listForUser(auth.session.userId);
  return jsonData(companies);
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.COMPANY]);
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
  const company = await companyService.createForUser(auth.session.userId, parsed.data);
  return jsonData(company, { status: 201 });
}

