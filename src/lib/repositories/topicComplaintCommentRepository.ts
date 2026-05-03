import mongoose from "mongoose";
import { getConnection } from "../db";
import { TopicComplaintCommentModel } from "../../models/TopicComplaintComment";

export type TopicCommentDto = {
  id: string;
  authorUserId: string;
  authorLabel: string;
  content: string;
  createdAt: string;
};

function toDto(doc: { _id: unknown; authorUserId: string; authorLabel: string; content: string; createdAt: Date }): TopicCommentDto {
  return {
    id: String(doc._id),
    authorUserId: doc.authorUserId,
    authorLabel: doc.authorLabel,
    content: doc.content,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
  };
}

export async function insertTopicComplaintComment(input: {
  complaintId: string;
  topicSlug: string;
  authorUserId: string;
  authorLabel: string;
  content: string;
}): Promise<TopicCommentDto> {
  await getConnection();
  const doc = await TopicComplaintCommentModel.create({
    complaintId: new mongoose.Types.ObjectId(input.complaintId),
    topicSlug: input.topicSlug,
    authorUserId: input.authorUserId,
    authorLabel: input.authorLabel,
    content: input.content,
  });
  return toDto(doc.toObject() as Parameters<typeof toDto>[0]);
}

/** Últimos `limit` comentários, em ordem cronológica (mais antigo → mais recente). */
export async function listRecentTopicComments(
  complaintId: string,
  topicSlug: string,
  limit: number
): Promise<{ items: TopicCommentDto[]; hasOlder: boolean }> {
  await getConnection();
  const oid = new mongoose.Types.ObjectId(complaintId);
  const raw = await TopicComplaintCommentModel.find({ complaintId: oid, topicSlug })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 50))
    .lean();
  const items = [...raw].reverse().map((d) =>
    toDto(d as { _id: unknown; authorUserId: string; authorLabel: string; content: string; createdAt: Date })
  );
  if (raw.length === 0) return { items: [], hasOlder: false };
  const oldest = raw[raw.length - 1]!;
  const olderCount = await TopicComplaintCommentModel.countDocuments({
    complaintId: oid,
    topicSlug,
    createdAt: { $lt: oldest.createdAt },
  });
  return { items, hasOlder: olderCount > 0 };
}

/** Comentários mais antigos que `before` (exclusive), ordem cronológica. */
export async function listOlderTopicComments(
  complaintId: string,
  topicSlug: string,
  before: Date,
  limit: number
): Promise<{ items: TopicCommentDto[]; hasOlder: boolean }> {
  await getConnection();
  const oid = new mongoose.Types.ObjectId(complaintId);
  const raw = await TopicComplaintCommentModel.find({
    complaintId: oid,
    topicSlug,
    createdAt: { $lt: before },
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 50))
    .lean();
  const items = [...raw].reverse().map((d) =>
    toDto(d as { _id: unknown; authorUserId: string; authorLabel: string; content: string; createdAt: Date })
  );
  if (raw.length === 0) return { items: [], hasOlder: false };
  const oldest = raw[raw.length - 1]!;
  const olderCount = await TopicComplaintCommentModel.countDocuments({
    complaintId: oid,
    topicSlug,
    createdAt: { $lt: oldest.createdAt },
  });
  return { items, hasOlder: olderCount > 0 };
}
