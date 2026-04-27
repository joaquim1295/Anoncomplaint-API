import { requireApiAuth } from "../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../lib/api/http";
import * as complaintService from "../../../../../lib/complaintService";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const result = await complaintService.deleteComplaint(id, auth.session.userId);
  if (!result.success) return jsonError("delete_failed", result.error, 400);
  return jsonData({ id, deleted: true });
}

