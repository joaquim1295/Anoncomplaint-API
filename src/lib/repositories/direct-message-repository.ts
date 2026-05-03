import { getConnection } from "../db";
import { DirectMessageModel } from "../../models/DirectMessage";
import type { DirectMessageDocument, MessageSenderRole } from "../../models/DirectMessage";

export async function create(data: {
  conversationId: string;
  senderUserId: string;
  senderRole: MessageSenderRole;
  content: string;
}): Promise<DirectMessageDocument> {
  await getConnection();
  const role = data.senderRole;
  const doc = await DirectMessageModel.create({
    conversationId: data.conversationId,
    senderUserId: data.senderUserId,
    senderRole: role,
    content: data.content,
    createdAt: new Date(),
    readByUser: role === "user",
    readByCompany: role === "company",
  });
  return doc.toObject() as DirectMessageDocument;
}

export async function listByConversation(
  conversationId: string,
  limit = 100
): Promise<DirectMessageDocument[]> {
  await getConnection();
  const docs = await DirectMessageModel.find({ conversationId })
    .sort({ createdAt: 1 })
    .limit(Math.max(1, Math.min(300, limit)))
    .lean();
  return docs as DirectMessageDocument[];
}

export async function getLatestByConversation(
  conversationId: string
): Promise<DirectMessageDocument | null> {
  await getConnection();
  const doc = await DirectMessageModel.findOne({ conversationId })
    .sort({ createdAt: -1 })
    .lean();
  return doc as DirectMessageDocument | null;
}

export async function countUnreadForSide(
  conversationId: string,
  side: "user" | "company"
): Promise<number> {
  await getConnection();
  const query =
    side === "user"
      ? { conversationId, readByUser: false, senderRole: "company" }
      : { conversationId, readByCompany: false, senderRole: "user" };
  return DirectMessageModel.countDocuments(query);
}

export async function markReadForSide(
  conversationId: string,
  side: "user" | "company"
): Promise<void> {
  await getConnection();
  const query =
    side === "user"
      ? { conversationId, readByUser: false, senderRole: "company" }
      : { conversationId, readByCompany: false, senderRole: "user" };
  const update = side === "user" ? { $set: { readByUser: true } } : { $set: { readByCompany: true } };
  await DirectMessageModel.updateMany(query, update);
}

export type InboxMessageAggRow = {
  latestByConv: Map<string, DirectMessageDocument>;
  unreadUserByConv: Map<string, number>;
  unreadCompanyByConv: Map<string, number>;
};

/** Uma agregação para última mensagem e contagens não lidas por conversa (evita N+1). */
export async function aggregateInboxMetricsForConversations(
  conversationIds: string[]
): Promise<InboxMessageAggRow> {
  const empty: InboxMessageAggRow = {
    latestByConv: new Map(),
    unreadUserByConv: new Map(),
    unreadCompanyByConv: new Map(),
  };
  if (conversationIds.length === 0) return empty;
  await getConnection();
  const raw = await DirectMessageModel.collection
    .aggregate([
      { $match: { conversationId: { $in: conversationIds } } },
      {
        $facet: {
          latest: [
            { $sort: { createdAt: -1 } },
            { $group: { _id: "$conversationId", doc: { $first: "$$ROOT" } } },
          ],
          unreadUser: [
            { $match: { readByUser: false, senderRole: "company" } },
            { $group: { _id: "$conversationId", c: { $sum: 1 } } },
          ],
          unreadCompany: [
            { $match: { readByCompany: false, senderRole: "user" } },
            { $group: { _id: "$conversationId", c: { $sum: 1 } } },
          ],
        },
      },
    ])
    .toArray();

  const facet = raw[0] as {
    latest?: { _id: string; doc: DirectMessageDocument }[];
    unreadUser?: { _id: string; c: number }[];
    unreadCompany?: { _id: string; c: number }[];
  };

  const latestByConv = new Map<string, DirectMessageDocument>();
  for (const row of facet?.latest ?? []) {
    latestByConv.set(String(row._id), row.doc);
  }
  const unreadUserByConv = new Map<string, number>();
  for (const row of facet?.unreadUser ?? []) {
    unreadUserByConv.set(String(row._id), row.c);
  }
  const unreadCompanyByConv = new Map<string, number>();
  for (const row of facet?.unreadCompany ?? []) {
    unreadCompanyByConv.set(String(row._id), row.c);
  }
  return { latestByConv, unreadUserByConv, unreadCompanyByConv };
}
