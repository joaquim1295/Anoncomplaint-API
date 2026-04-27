import { requireApiAuth } from "../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../lib/api/http";
import * as notificationRepository from "../../../../../../lib/repositories/notification-repository";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const updated = await notificationRepository.markAsRead(id, auth.session.userId);
  if (!updated) return jsonError("not_found", "Notification not found", 404);
  return jsonData({ id, isRead: true });
}

