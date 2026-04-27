import { requireApiAuth } from "../../../../../../lib/api/auth";
import { jsonData } from "../../../../../../lib/api/http";
import * as complaintService from "../../../../../../lib/complaintService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const result = await complaintService.toggleEndorsement(id, auth.session.userId);
  if (!result.success) {
    return Response.json(
      { error: { code: "endorse_failed", message: result.error } },
      { status: 400 }
    );
  }
  return jsonData({
    id,
    endorsed: result.endorsed,
    endorsementsCount: (result.complaint.endorsedBy ?? []).length,
  });
}

