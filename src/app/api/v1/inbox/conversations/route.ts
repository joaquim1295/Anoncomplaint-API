import { z } from "zod";
import { requireApiAuth } from "../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../lib/api/http";
import { getClientIp, inboxLimiter, rateLimitOrNull } from "../../../../../lib/rate-limit";
import * as inboxService from "../../../../../lib/services/inbox-service";

const createSchema = z.object({
  companyId: z.string().optional(),
  userId: z.string().optional(),
  message: z.string().max(2000).optional(),
});

export async function GET(request: Request) {
  const limited = await rateLimitOrNull(inboxLimiter, getClientIp(request), "inbox");
  if (limited) return limited;
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const list = await inboxService.listConversationsForActor(auth.session.userId);
  return jsonData(list);
}

export async function POST(request: Request) {
  const limited = await rateLimitOrNull(inboxLimiter, getClientIp(request), "inbox");
  if (limited) return limited;

  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "JSON inválido", 400);
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation_error", "Dados inválidos", 400, parsed.error.flatten());
  }

  const created = await inboxService.createOrGetConversation({
    actorUserId: auth.session.userId,
    role: auth.session.role,
    companyId: parsed.data.companyId,
    userId: parsed.data.userId,
    initialMessage: parsed.data.message,
  });
  if (!created.ok) return jsonError("create_failed", created.error, 400);
  return jsonData({ conversationId: created.conversationId }, { status: 201 });
}
