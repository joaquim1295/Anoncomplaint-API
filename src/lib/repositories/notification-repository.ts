import { getConnection } from "../db";
import { NotificationModel } from "../../models/Notification";
import type { NotificationDocument } from "../../models/Notification";

export async function create(data: {
  userId: string;
  title: string;
  message: string;
  complaintId?: string | null;
}): Promise<NotificationDocument> {
  await getConnection();
  const doc = await NotificationModel.create({
    userId: data.userId,
    title: data.title,
    message: data.message,
    complaintId: data.complaintId ?? null,
  });
  return doc.toObject() as NotificationDocument;
}

export async function createMany(
  items: { userId: string; title: string; message: string; complaintId?: string | null }[]
): Promise<void> {
  if (!items.length) return;
  await getConnection();
  await NotificationModel.insertMany(
    items.map((d) => ({
      userId: d.userId,
      title: d.title,
      message: d.message,
      complaintId: d.complaintId ?? null,
    })),
    { ordered: false }
  );
}

export async function findByUserId(
  userId: string,
  options: { limit?: number; offset?: number; onlyUnread?: boolean } = {}
): Promise<NotificationDocument[]> {
  await getConnection();
  const { limit = 50, offset = 0, onlyUnread = false } = options;
  const query: Record<string, unknown> = { userId };
  if (onlyUnread) query.isRead = false;
  const docs = await NotificationModel.find(query)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
  return docs as NotificationDocument[];
}

export async function markAsRead(
  id: string,
  userId: string
): Promise<NotificationDocument | null> {
  await getConnection();
  const doc = await NotificationModel.findOneAndUpdate(
    { _id: id, userId },
    { $set: { isRead: true } },
    { new: true }
  ).lean();
  return doc as NotificationDocument | null;
}
