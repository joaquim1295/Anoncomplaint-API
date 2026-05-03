import * as companyRepository from "../repositories/companyRepository";
import * as userRepository from "../repositories/userRepository";
import * as conversationRepository from "../repositories/conversation-repository";
import * as messageRepository from "../repositories/direct-message-repository";
import * as notificationRepository from "../repositories/notification-repository";
import { privateInboxChannel, privateUserChannel, triggerRealtimeEvent } from "../realtime/pusher-server";

export type InboxSide = "user" | "company";

export interface InboxConversationItem {
  id: string;
  userId: string;
  companyId: string;
  side: InboxSide;
  counterpartName: string;
  counterpartSubtitle?: string;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

export interface InboxMessageItem {
  id: string;
  conversationId: string;
  senderRole: InboxSide;
  senderUserId: string;
  content: string;
  createdAt: string;
}

export async function getOwnedCompanyIds(userId: string): Promise<string[]> {
  const companies = await companyRepository.findByOwner(userId);
  return companies.map((c) => String(c._id));
}

async function resolveSide(
  conversation: { userId: string; companyId: string },
  actorUserId: string,
  ownedCompanyIds: string[]
): Promise<InboxSide | null> {
  if (conversation.userId === actorUserId) return "user";
  if (ownedCompanyIds.includes(conversation.companyId)) return "company";
  return null;
}

export async function listConversationsForActor(actorUserId: string): Promise<InboxConversationItem[]> {
  const ownedCompanyIds = await getOwnedCompanyIds(actorUserId);
  const convs = await conversationRepository.listForUserOrCompanies(actorUserId, ownedCompanyIds, 80);
  const convIds = convs.map((c) => String(c._id));
  const companyIds = [...new Set(convs.map((c) => c.companyId))];
  const userIds = [...new Set(convs.map((c) => c.userId))];

  const [agg, companies, users] = await Promise.all([
    messageRepository.aggregateInboxMetricsForConversations(convIds),
    companyRepository.findByIds(companyIds),
    userRepository.findUserByIds(userIds),
  ]);
  const companyMap = new Map(companies.map((c) => [String(c._id), c]));
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const out: InboxConversationItem[] = [];
  for (const conv of convs) {
    const side = await resolveSide(conv, actorUserId, ownedCompanyIds);
    if (!side) continue;
    const cid = String(conv._id);
    const latest = agg.latestByConv.get(cid) ?? null;
    const unreadCount =
      side === "user" ? (agg.unreadUserByConv.get(cid) ?? 0) : (agg.unreadCompanyByConv.get(cid) ?? 0);
    const company = companyMap.get(conv.companyId);
    const user = userMap.get(conv.userId);
    const counterpartName =
      side === "user" ? company?.name ?? "Empresa" : user?.username || user?.email || "Utilizador";
    const counterpartSubtitle =
      side === "user" ? (company?.slug ? `/${company.slug}` : undefined) : user?.email;

    out.push({
      id: cid,
      userId: conv.userId,
      companyId: conv.companyId,
      side,
      counterpartName,
      counterpartSubtitle,
      lastMessage: latest?.content ?? null,
      lastMessageAt: (conv.lastMessageAt ?? conv.updatedAt ?? conv.createdAt).toISOString(),
      unreadCount,
    });
  }

  return out;
}

export async function createOrGetConversation(params: {
  actorUserId: string;
  role: string;
  companyId?: string;
  userId?: string;
  initialMessage?: string;
}): Promise<{ ok: true; conversationId: string } | { ok: false; error: string }> {
  const companyId = String(params.companyId ?? "").trim();
  const targetUserId = String(params.userId ?? "").trim();
  const role = String(params.role ?? "user");

  let userId = "";
  let finalCompanyId = "";

  if (role === "company" || role === "admin") {
    if (!targetUserId || !companyId) {
      return { ok: false, error: "Company e user são obrigatórios para iniciar conversa como empresa." };
    }
    const owns = (await getOwnedCompanyIds(params.actorUserId)).includes(companyId);
    if (!owns && role !== "admin") return { ok: false, error: "Sem permissão para esta empresa." };
    userId = targetUserId;
    finalCompanyId = companyId;
  } else {
    if (!companyId) return { ok: false, error: "Empresa inválida." };
    userId = params.actorUserId;
    finalCompanyId = companyId;
  }

  const [company, user] = await Promise.all([
    companyRepository.findById(finalCompanyId),
    userRepository.findUserById(userId),
  ]);
  if (!company) return { ok: false, error: "Empresa não encontrada." };
  if (!user) return { ok: false, error: "Utilizador não encontrado." };

  const conv = await conversationRepository.upsertByUserAndCompany({ userId, companyId: finalCompanyId });

  const initial = String(params.initialMessage ?? "").trim();
  if (initial) {
    const senderRole: InboxSide = userId === params.actorUserId ? "user" : "company";
    const msg = await messageRepository.create({
      conversationId: String(conv._id),
      senderUserId: params.actorUserId,
      senderRole,
      content: initial.slice(0, 2000),
    });
    await conversationRepository.touch(String(conv._id), msg.createdAt);
  }
  return { ok: true, conversationId: String(conv._id) };
}

export async function listMessagesForActor(params: {
  actorUserId: string;
  conversationId: string;
}): Promise<{ ok: true; side: InboxSide; messages: InboxMessageItem[] } | { ok: false; error: string; status: number }> {
  const conv = await conversationRepository.findById(params.conversationId);
  if (!conv) return { ok: false, error: "Conversa não encontrada.", status: 404 };
  const owned = await getOwnedCompanyIds(params.actorUserId);
  const side = await resolveSide(conv, params.actorUserId, owned);
  if (!side) return { ok: false, error: "Sem permissão para esta conversa.", status: 403 };

  const messages = await messageRepository.listByConversation(String(conv._id), 200);
  return {
    ok: true,
    side,
    messages: messages.map((m) => ({
      id: String(m._id),
      conversationId: m.conversationId,
      senderRole: m.senderRole,
      senderUserId: m.senderUserId,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function markConversationReadForActor(params: {
  actorUserId: string;
  conversationId: string;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const conv = await conversationRepository.findById(params.conversationId);
  if (!conv) return { ok: false, error: "Conversa não encontrada.", status: 404 };
  const owned = await getOwnedCompanyIds(params.actorUserId);
  const side = await resolveSide(conv, params.actorUserId, owned);
  if (!side) return { ok: false, error: "Sem permissão para esta conversa.", status: 403 };
  await messageRepository.markReadForSide(String(conv._id), side);
  return { ok: true };
}

export async function sendMessageAsActor(params: {
  actorUserId: string;
  conversationId: string;
  content: string;
}): Promise<{ ok: true; message: InboxMessageItem } | { ok: false; error: string; status: number }> {
  const conv = await conversationRepository.findById(params.conversationId);
  if (!conv) return { ok: false, error: "Conversa não encontrada.", status: 404 };
  const owned = await getOwnedCompanyIds(params.actorUserId);
  const side = await resolveSide(conv, params.actorUserId, owned);
  if (!side) return { ok: false, error: "Sem permissão para enviar nesta conversa.", status: 403 };

  const content = params.content.trim();
  if (!content) return { ok: false, error: "Mensagem vazia.", status: 400 };
  const msg = await messageRepository.create({
    conversationId: String(conv._id),
    senderUserId: params.actorUserId,
    senderRole: side,
    content: content.slice(0, 2000),
  });
  await conversationRepository.touch(String(conv._id), msg.createdAt);

  const recipientUserId = side === "user" ? conv.companyId : conv.userId;
  const [senderUser, companyForOwner] = await Promise.all([
    userRepository.findUserById(params.actorUserId),
    side === "user" ? companyRepository.findById(conv.companyId) : Promise.resolve(null),
  ]);
  let resolvedRecipientUserId = recipientUserId;
  if (side === "user" && companyForOwner?.ownerUserId) {
    resolvedRecipientUserId = companyForOwner.ownerUserId;
  }
  const senderLabel = senderUser?.username || senderUser?.email || "Utilizador";
  const notificationTitle = "Nova mensagem direta";
  const notificationMessage = `${senderLabel}: ${msg.content.slice(0, 120)}`;

  if (resolvedRecipientUserId) {
    await notificationRepository.create({
      userId: resolvedRecipientUserId,
      title: notificationTitle,
      message: notificationMessage,
      complaintId: null,
    });
  }

  const payload = {
    conversationId: String(conv._id),
    message: {
      id: String(msg._id),
      conversationId: msg.conversationId,
      senderRole: msg.senderRole,
      senderUserId: msg.senderUserId,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    },
    from: senderLabel,
  } as const;

  await Promise.all([
    triggerRealtimeEvent(privateInboxChannel(String(conv._id)), "inbox:new-message", payload),
    resolvedRecipientUserId
      ? triggerRealtimeEvent(privateUserChannel(resolvedRecipientUserId), "inbox:new-message", payload)
      : Promise.resolve(),
  ]);

  return {
    ok: true,
    message: {
      id: String(msg._id),
      conversationId: msg.conversationId,
      senderRole: msg.senderRole,
      senderUserId: msg.senderUserId,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    },
  };
}
