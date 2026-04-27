import { z } from "zod";
import { requireApiAuth } from "../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../lib/api/http";
import * as complaintService from "../../../../../../lib/complaintService";
import { ComplaintStatus } from "../../../../../../types/complaint";

const schema = z.object({
  status: z.nativeEnum(ComplaintStatus),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
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
  const result = await complaintService.updateComplaintStatusForCompany(
    id,
    auth.session.userId,
    parsed.data.status
  );
  if (!result.success) return jsonError("update_failed", result.error, 400);
  return jsonData({ id, status: parsed.data.status });
}

