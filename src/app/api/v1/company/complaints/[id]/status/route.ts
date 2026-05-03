import { z } from "zod";
import { requireApiAuth, requireRole } from "../../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../../lib/api/http";
import * as complaintService from "../../../../../../../lib/complaintService";
import * as companyRepository from "../../../../../../../lib/repositories/companyRepository";
import { ComplaintStatus } from "../../../../../../../types/complaint";
import { UserRole } from "../../../../../../../types/user";

const objectId = z.string().length(24).regex(/^[a-f0-9]{24}$/i);

const schema = z.object({
  status: z.enum([ComplaintStatus.RESOLVED, ComplaintStatus.ARCHIVED]),
  company_id: objectId.optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const role = requireRole(auth.session, [UserRole.USER, UserRole.COMPANY, UserRole.ADMIN]);
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
  const owned = await companyRepository.findByOwner(auth.session.userId);
  let companyId = parsed.data.company_id ?? null;
  if (!companyId && owned.length === 1) {
    companyId = String(owned[0]._id);
  }
  if (!companyId) {
    return jsonError("validation_error", "Indique company_id quando gere mais do que uma empresa.", 400);
  }
  if (
    auth.session.role !== UserRole.ADMIN &&
    !owned.some((c) => String(c._id) === companyId)
  ) {
    return jsonError("forbidden", "Empresa inválida para este utilizador.", 403);
  }
  const result = await complaintService.updateComplaintStatusForCompany(
    id,
    auth.session.userId,
    companyId,
    parsed.data.status,
    { bypassOwnership: auth.session.role === UserRole.ADMIN }
  );
  if (!result.success) return jsonError("update_failed", result.error, 400);
  return jsonData({ id, status: parsed.data.status });
}

