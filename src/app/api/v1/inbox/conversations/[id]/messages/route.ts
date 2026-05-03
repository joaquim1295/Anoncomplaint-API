import { z } from "zod";
import { requireApiAuth } from "../../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../../lib/api/http";
import * as inboxService from "../../../../../../../lib/services/inbox-service";

const postSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const data = await inboxService.listMessagesForActor({
    actorUserId: auth.session.userId,
    conversationId: id,
  });
  if (!data.ok) return jsonError("forbidden", data.error, data.status);
  return jsonData({ side: data.side, messages: data.messages });
}

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
    return jsonError("bad_request", "JSON inválido", 400);
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation_error", "Mensagem inválida", 400, parsed.error.flatten());
  }

  const sent = await inboxService.sendMessageAsActor({
    actorUserId: auth.session.userId,
    conversationId: id,
    content: parsed.data.content,
  });
  if (!sent.ok) return jsonError("send_failed", sent.error, sent.status);
  return jsonData(sent.message, { status: 201 });
}
