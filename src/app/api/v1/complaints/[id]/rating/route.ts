import { z } from "zod";
import { requireApiAuth } from "@/lib/api/auth";
import { jsonData, jsonError } from "@/lib/api/http";
import * as complaintService from "@/lib/complaintService";

const schema = z.object({
  rating: z.number().min(0).max(10),
});

export async function POST(
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
  const result = await complaintService.setComplaintFinalRating(
    id,
    auth.session.userId,
    auth.session.role,
    parsed.data.rating
  );
  if (!result.success) return jsonError("rating_failed", result.error, 400);
  return jsonData({ id, rating: parsed.data.rating });
}

