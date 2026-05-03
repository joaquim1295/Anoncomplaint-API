import { requireApiAuth } from "../../../../../lib/api/auth";
import { jsonError } from "../../../../../lib/api/http";
import { getPusherForAuth } from "../../../../../lib/realtime/pusher-server";
import * as conversationRepository from "../../../../../lib/repositories/conversation-repository";
import * as companyRepository from "../../../../../lib/repositories/companyRepository";

async function parseAuthBody(request: Request): Promise<{ socketId: string; channelName: string }> {
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = (await request.json()) as { socket_id?: string; channel_name?: string };
    return {
      socketId: String(body.socket_id ?? "").trim(),
      channelName: String(body.channel_name ?? "").trim(),
    };
  }
  const raw = await request.text();
  const params = new URLSearchParams(raw);
  return {
    socketId: String(params.get("socket_id") ?? "").trim(),
    channelName: String(params.get("channel_name") ?? "").trim(),
  };
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;

  const pusher = getPusherForAuth();
  if (!pusher) {
    return jsonError("service_unavailable", "Pusher não configurado no servidor.", 503);
  }

  const { socketId, channelName } = await parseAuthBody(request);
  if (!socketId || !channelName) {
    return jsonError("bad_request", "socket_id e channel_name são obrigatórios.", 400);
  }

  const userPrivate = channelName.match(/^private-user-(.+)$/);
  if (userPrivate) {
    if (userPrivate[1] !== auth.session.userId) {
      return jsonError("forbidden", "Canal não autorizado.", 403);
    }
    const authPayload = pusher.authorizeChannel(socketId, channelName);
    return Response.json(authPayload);
  }

  const inboxPrivate = channelName.match(/^private-inbox-(.+)$/);
  if (inboxPrivate) {
    const convId = inboxPrivate[1];
    const conv = await conversationRepository.findById(convId);
    if (!conv) return jsonError("forbidden", "Conversa não encontrada.", 403);
    if (conv.userId === auth.session.userId) {
      return Response.json(pusher.authorizeChannel(socketId, channelName));
    }
    const company = await companyRepository.findById(conv.companyId);
    if (company?.ownerUserId === auth.session.userId) {
      return Response.json(pusher.authorizeChannel(socketId, channelName));
    }
    return jsonError("forbidden", "Sem acesso a esta conversa.", 403);
  }

  return jsonError("forbidden", "Canal não suportado.", 403);
}
