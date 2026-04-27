import { jsonData, jsonError } from "../../../../../../lib/api/http";
import { complaintIdSchema } from "../../../../../../lib/validations";
import * as complaintService from "../../../../../../lib/services/complaint-service";
import * as aiContextService from "../../../../../../lib/services/ai-context-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ complaintId: string }> }
) {
  const { complaintId } = await params;
  const parsed = complaintIdSchema.safeParse({ id: complaintId });
  if (!parsed.success) return jsonError("validation_error", "ID inválido", 400);

  const complaint = await complaintService.getComplaintById(parsed.data.id);
  if (!complaint) return jsonError("not_found", "Denúncia não encontrada", 404);

  const summary = await aiContextService.extractComplaintContext({
    complaint: { content: complaint.content, tags: complaint.tags ?? [] },
  });

  const related = await complaintService.getRelatedComplaints(summary.company, complaint.tags ?? [], {
    excludeId: parsed.data.id,
    limit: 5,
  });

  return jsonData({ summary, related });
}

