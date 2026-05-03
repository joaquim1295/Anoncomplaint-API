import { z } from "zod";
import { requireApiAuth, requireRole } from "../../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../../lib/api/http";
import * as complaintService from "../../../../../../../lib/complaintService";
import { UserRole } from "../../../../../../../types/user";

const schema = z.object({
  companyId: z.string().min(1),
  content: z.string().min(10).max(2000),
});

export async function POST(
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
  const result = await complaintService.addOfficialResponse(
    id,
    auth.session.userId,
    parsed.data.companyId,
    parsed.data.content,
    { bypassOwnership: auth.session.role === UserRole.ADMIN }
  );
  if (!result.success) return jsonError("response_failed", result.error, 400);
  return jsonData({ id, responded: true });
}

