import { getConnection } from "../db";
import { ConversationModel } from "../../models/Conversation";
import type { ConversationDocument } from "../../models/Conversation";

export async function findById(id: string): Promise<ConversationDocument | null> {
  await getConnection();
  const doc = await ConversationModel.findById(id).lean();
  return doc as ConversationDocument | null;
}

export async function findByUserAndCompany(
  userId: string,
  companyId: string
): Promise<ConversationDocument | null> {
  await getConnection();
  const doc = await ConversationModel.findOne({ userId, companyId }).lean();
  return doc as ConversationDocument | null;
}

export async function create(data: {
  userId: string;
  companyId: string;
}): Promise<ConversationDocument> {
  await getConnection();
  const now = new Date();
  const doc = await ConversationModel.create({
    userId: data.userId,
    companyId: data.companyId,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: null,
  });
  return doc.toObject() as ConversationDocument;
}

/** Upsert atómico por (userId, companyId) — evita E11000 em pedidos concorrentes. */
export async function upsertByUserAndCompany(data: {
  userId: string;
  companyId: string;
}): Promise<ConversationDocument> {
  await getConnection();
  const now = new Date();
  const doc = await ConversationModel.findOneAndUpdate(
    { userId: data.userId, companyId: data.companyId },
    {
      $setOnInsert: {
        userId: data.userId,
        companyId: data.companyId,
        createdAt: now,
        updatedAt: now,
        lastMessageAt: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return doc as ConversationDocument;
}

export async function touch(conversationId: string, messageAt: Date): Promise<void> {
  await getConnection();
  await ConversationModel.updateOne(
    { _id: conversationId },
    { $set: { updatedAt: messageAt, lastMessageAt: messageAt } }
  );
}

export async function listForUserOrCompanies(
  userId: string,
  companyIds: string[],
  limit = 60
): Promise<ConversationDocument[]> {
  await getConnection();
  const query =
    companyIds.length > 0
      ? {
          $or: [{ userId }, { companyId: { $in: companyIds } }],
        }
      : { userId };
  const docs = await ConversationModel.find(query)
    .sort({ lastMessageAt: -1, updatedAt: -1, createdAt: -1 })
    .limit(Math.max(1, Math.min(200, limit)))
    .lean();
  return docs as ConversationDocument[];
}
