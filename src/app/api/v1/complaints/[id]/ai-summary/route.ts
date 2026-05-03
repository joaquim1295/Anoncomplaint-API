import { requireApiAuth } from "@/lib/api/auth";
import { jsonData, jsonError } from "@/lib/api/http";
import { complaintIdSchema } from "@/lib/validations";
import * as complaintService from "@/lib/complaintService";
import { aiSummaryLimiter, getClientIp, rateLimitOrNull } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimitOrNull(aiSummaryLimiter, getClientIp(request), "aiSummary");
  if (limited) return limited;

  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = complaintIdSchema.safeParse({ id });
  if (!parsed.success) return jsonError("validation_error", "ID inválido", 400);

  const complaint = await complaintService.getComplaintById(parsed.data.id);
  if (!complaint) return jsonError("not_found", "Denúncia não encontrada", 404);

  const allowed = await complaintService.canUserAccessComplaintAiContext(
    complaint,
    auth.session.userId,
    auth.session.role
  );
  if (!allowed) return jsonError("forbidden", "Sem permissão.", 403);

  const { ai_summary } = await complaintService.ensureComplaintAiSummary(parsed.data.id, complaint);
  return jsonData({ ai_summary });
}
