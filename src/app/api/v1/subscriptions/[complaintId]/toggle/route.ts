import { requireApiAuth } from "../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../lib/api/http";
import * as userRepository from "../../../../../../lib/repositories/userRepository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ complaintId: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const { complaintId } = await params;
  const trimmed = String(complaintId ?? "").trim();
  if (!trimmed) return jsonError("validation_error", "Invalid complaintId", 400);
  const result = await userRepository.toggleComplaintSubscription(auth.session.userId, trimmed);
  if (!result.user) return jsonError("not_found", "User not found", 404);
  return jsonData({
    complaintId: trimmed,
    subscribed: result.subscribed,
  });
}

