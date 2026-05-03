import { requireApiAuth } from "../../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../../lib/api/http";
import * as inboxService from "../../../../../../../lib/services/inbox-service";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(_request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const result = await inboxService.markConversationReadForActor({
    actorUserId: auth.session.userId,
    conversationId: id,
  });
  if (!result.ok) return jsonError("forbidden", result.error, result.status);
  return jsonData({ ok: true });
}
