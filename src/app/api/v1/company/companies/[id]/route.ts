import { z } from "zod";
import { requireApiAuth, requireRole } from "../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../lib/api/http";
import * as companyService from "../../../../../../lib/companyService";
import { UserRole } from "../../../../../../types/user";

const schema = z.object({
  name: z.string().min(2).max(160),
  website: z.string().url().optional().or(z.literal("")).transform((v) => v || undefined),
  description: z.string().max(600).optional().or(z.literal("")).transform((v) => v || undefined),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.COMPANY]);
  if (!role.ok) return role.response;
  const { id } = await params;
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
  const updated = await companyService.updateForUser(auth.session.userId, id, parsed.data);
  if (!updated) return jsonError("not_found", "Company not found", 404);
  return jsonData(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.COMPANY]);
  if (!role.ok) return role.response;
  const { id } = await params;
  const ok = await companyService.deleteForUser(auth.session.userId, id);
  if (!ok) return jsonError("not_found", "Company not found", 404);
  return jsonData({ id, deleted: true });
}

