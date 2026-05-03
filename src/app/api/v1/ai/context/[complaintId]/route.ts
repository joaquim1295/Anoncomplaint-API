import { requireApiAuth } from "../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../lib/api/http";
import { complaintIdSchema } from "../../../../../../lib/validations";
import * as complaintService from "../../../../../../lib/complaintService";
import * as aiContextService from "../../../../../../lib/services/ai-context-service";
import { aiContextLimiter, getClientIp, rateLimitOrNull } from "../../../../../../lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ complaintId: string }> }
) {
  const rateLimited = await rateLimitOrNull(aiContextLimiter, getClientIp(request), "aiContext");
  if (rateLimited) return rateLimited;

  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;

  const { complaintId } = await params;
  const parsed = complaintIdSchema.safeParse({ id: complaintId });
  if (!parsed.success) return jsonError("validation_error", "ID inválido", 400);

  const complaint = await complaintService.getComplaintById(parsed.data.id);
  if (!complaint) return jsonError("not_found", "Denúncia não encontrada", 404);

  const allowed = await complaintService.canUserAccessComplaintAiContext(
    complaint,
    auth.session.userId,
    auth.session.role
  );
  if (!allowed) return jsonError("forbidden", "Sem permissão para contexto IA desta denúncia.", 403);

  const summary = await aiContextService.extractComplaintContext({
    complaint: { content: complaint.content, tags: complaint.tags ?? [] },
  });

  const related = await complaintService.getRelatedComplaints(summary.company, complaint.tags ?? [], {
    excludeId: parsed.data.id,
    limit: 5,
  });

  return jsonData({ summary, related });
}
