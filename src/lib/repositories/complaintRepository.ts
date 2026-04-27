import { getConnection } from "../db";
import { ComplaintModel } from "../../models/Complaint";
import type { ComplaintDocument, OfficialResponsePayload } from "../../models/Complaint";
import { ComplaintStatus } from "../../types/complaint";
import mongoose from "mongoose";

export interface FindComplaintsFilter {
  author_id?: string | null;
  status?: ComplaintStatus;
  limit?: number;
  offset?: number;
}

const MAX_SEARCH_QUERY_LENGTH = 200;

export async function create(data: {
  author_id: string | null;
  content: string;
  tags: string[];
  status?: ComplaintStatus;
  location?: import("../../models/Complaint").ComplaintLocation | null;
}): Promise<ComplaintDocument> {
  await getConnection();
  const doc = await ComplaintModel.create({
    ...data,
    status: data.status ?? ComplaintStatus.PENDING,
  });
  return doc.toObject() as ComplaintDocument;
}

export async function find(filter: FindComplaintsFilter = {}): Promise<ComplaintDocument[]> {
  await getConnection();
  const { author_id, status, limit = 50, offset = 0 } = filter;
  const query: Record<string, unknown> = {};
  if (author_id !== undefined) query.author_id = author_id;
  if (status !== undefined) query.status = status;
  else query.status = { $ne: ComplaintStatus.PENDING_REVIEW };
  const docs = await ComplaintModel.find(query)
    .sort({ created_at: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
  return docs as ComplaintDocument[];
}

export async function findWithAuthor(
  filter: FindComplaintsFilter = {}
): Promise<ComplaintDocument[]> {
  await getConnection();
  const { author_id, status, limit = 50, offset = 0 } = filter;
  const match: Record<string, unknown> = {};
  if (author_id !== undefined) match.author_id = author_id;
  if (status !== undefined) match.status = status;
  else match.status = { $ne: ComplaintStatus.PENDING_REVIEW };

  const pipeline: mongoose.PipelineStage[] = [
    { $match: match },
    { $sort: { created_at: -1 } },
    { $skip: offset },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        let: { authorId: "$author_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $ne: ["$$authorId", null] },
                  { $ne: ["$$authorId", ""] },
                  { $eq: ["$_id", { $toObjectId: "$$authorId" }] },
                ],
              },
            },
          },
          { $project: { email: 1, username: 1 } },
        ],
        as: "author_docs",
      },
    },
    {
      $addFields: {
        author: { $first: "$author_docs" },
      },
    },
    {
      $project: {
        author_docs: 0,
      },
    },
  ];

  const docs = await ComplaintModel.aggregate(pipeline);
  return docs as ComplaintDocument[];
}

export async function findAll(): Promise<ComplaintDocument[]> {
  await getConnection();
  const docs = await ComplaintModel.find({})
    .sort({ created_at: -1 })
    .lean();
  return docs as ComplaintDocument[];
}

export async function findById(id: string): Promise<ComplaintDocument | null> {
  await getConnection();
  const doc = await ComplaintModel.findById(id).lean();
  return doc as ComplaintDocument | null;
}

export interface SearchComplaintsOptions {
  q: string;
  limit?: number;
}

export async function search(
  options: SearchComplaintsOptions
): Promise<ComplaintDocument[]> {
  await getConnection();
  const { q, limit = 20 } = options;
  const trimmed = q.trim().slice(0, MAX_SEARCH_QUERY_LENGTH);
  if (!trimmed) return [];
  const safe = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pipeline: mongoose.PipelineStage[] = [
    {
      $match: {
        status: { $ne: ComplaintStatus.PENDING_REVIEW },
      },
    },
    {
      $lookup: {
        from: "users",
        let: { authorId: "$author_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $ne: ["$$authorId", null] },
                  { $ne: ["$$authorId", ""] },
                  { $eq: ["$_id", { $toObjectId: "$$authorId" }] },
                ],
              },
            },
          },
          { $project: { email: 1, username: 1 } },
        ],
        as: "author_docs",
      },
    },
    {
      $addFields: {
        author: { $first: "$author_docs" },
      },
    },
    {
      $match: {
        $or: [
          { content: { $regex: safe, $options: "i" } },
          { tags: { $elemMatch: { $regex: safe, $options: "i" } } },
          { title: { $regex: safe, $options: "i" } },
          { description: { $regex: safe, $options: "i" } },
          { "author.username": { $regex: safe, $options: "i" } },
          { "author.email": { $regex: safe, $options: "i" } },
        ],
      },
    },
    { $sort: { created_at: -1 } },
    { $limit: limit },
    {
      $project: {
        author_docs: 0,
      },
    },
  ];
  const docs = await ComplaintModel.aggregate(pipeline);
  return docs as ComplaintDocument[];
}

export async function findRelated(options: {
  company?: string;
  tags?: string[];
  excludeId?: string;
  limit?: number;
}): Promise<ComplaintDocument[]> {
  await getConnection();
  const limit = Math.max(1, Math.min(20, options.limit ?? 5));
  const tags = (options.tags ?? []).map((t) => String(t).trim()).filter(Boolean).slice(0, 10);
  const company = (options.company ?? "").trim().slice(0, 120);

  const or: Record<string, unknown>[] = [];
  if (company) {
    const safe = company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    or.push({ content: { $regex: new RegExp(safe, "i") } });
  }
  if (tags.length > 0) {
    or.push({ tags: { $in: tags } });
  }

  const query: Record<string, unknown> = {
    status: { $ne: ComplaintStatus.PENDING_REVIEW },
  };
  if (or.length > 0) query.$or = or;

  if (options.excludeId && mongoose.Types.ObjectId.isValid(options.excludeId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(options.excludeId) };
  }

  const docs = await ComplaintModel.find(query)
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();
  return docs as ComplaintDocument[];
}

export async function findByUserId(
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<ComplaintDocument[]> {
  await getConnection();
  const { limit = 50, offset = 0 } = options;
  const docs = await ComplaintModel.find({ author_id: userId })
    .sort({ created_at: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
  return docs as ComplaintDocument[];
}

export async function findByCompanyUserId(
  companyUserId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<ComplaintDocument[]> {
  await getConnection();
  const { limit = 50, offset = 0 } = options;
  const docs = await ComplaintModel.find({ "officialResponse.companyId": companyUserId })
    .sort({ created_at: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
  return docs as ComplaintDocument[];
}

export async function findPublicPaginated(
  page: number,
  limit: number
): Promise<{ complaints: ComplaintDocument[]; hasMore: boolean }> {
  await getConnection();
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Math.max(1, Math.min(100, Math.floor(Number.isFinite(limit) ? limit : 10)));
  const skip = (safePage - 1) * safeLimit;
  const docs = await ComplaintModel.find({ status: { $ne: ComplaintStatus.PENDING_REVIEW } })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(safeLimit + 1)
    .lean();
  const hasMore = docs.length > safeLimit;
  const slice = hasMore ? docs.slice(0, safeLimit) : docs;
  return { complaints: slice as ComplaintDocument[], hasMore };
}

export async function update(
  id: string,
  data: Partial<Pick<ComplaintDocument, "content" | "tags" | "status" | "author_id" | "officialResponse">>
): Promise<ComplaintDocument | null> {
  await getConnection();
  const doc = await ComplaintModel.findByIdAndUpdate(
    id,
    { ...data, updated_at: new Date() },
    { new: true }
  ).lean();
  return doc as ComplaintDocument | null;
}

export async function setOfficialResponse(
  complaintId: string,
  payload: OfficialResponsePayload
): Promise<ComplaintDocument | null> {
  await getConnection();
  const doc = await ComplaintModel.findByIdAndUpdate(
    complaintId,
    { officialResponse: payload, updated_at: new Date() },
    { new: true }
  ).lean();
  return doc as ComplaintDocument | null;
}

export async function addEndorsement(complaintId: string, userId: string): Promise<ComplaintDocument | null> {
  await getConnection();
  const doc = await ComplaintModel.findByIdAndUpdate(
    complaintId,
    { $addToSet: { endorsedBy: userId }, $set: { updated_at: new Date() } },
    { new: true }
  ).lean();
  return doc as ComplaintDocument | null;
}

export async function removeEndorsement(complaintId: string, userId: string): Promise<ComplaintDocument | null> {
  await getConnection();
  const doc = await ComplaintModel.findByIdAndUpdate(
    complaintId,
    { $pull: { endorsedBy: userId }, $set: { updated_at: new Date() } },
    { new: true }
  ).lean();
  return doc as ComplaintDocument | null;
}

export async function redact(id: string): Promise<ComplaintDocument | null> {
  await getConnection();
  const doc = await ComplaintModel.findByIdAndUpdate(
    id,
    {
      content: "[Redacted]",
      author_id: null,
      tags: [],
      updated_at: new Date(),
    },
    { new: true }
  ).lean();
  return doc as ComplaintDocument | null;
}

export async function forceDelete(id: string): Promise<boolean> {
  await getConnection();
  const res = await ComplaintModel.deleteOne({ _id: id });
  return (res.deletedCount ?? 0) > 0;
}

export interface DailyCountItem {
  date: string;
  count: number;
}

export async function countByDay(days = 30): Promise<DailyCountItem[]> {
  await getConnection();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const result = await ComplaintModel.aggregate<DailyCountItem>([
    { $match: { created_at: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", count: 1, _id: 0 } },
  ]);
  return result;
}

export interface WeeklyTrendItem {
  date: string;
  count: number;
}

export async function getWeeklyTrends(): Promise<WeeklyTrendItem[]> {
  await getConnection();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  const result = await ComplaintModel.aggregate<DailyCountItem>([
    { $match: { created_at: { $gte: start }, status: { $ne: ComplaintStatus.PENDING_REVIEW } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", count: 1, _id: 0 } },
  ]);
  return result;
}

export async function count(filter: { author_id?: string; status?: ComplaintStatus } = {}): Promise<number> {
  await getConnection();
  const query: Record<string, unknown> = {};
  if (filter.author_id !== undefined) query.author_id = filter.author_id;
  if (filter.status !== undefined) query.status = filter.status;
  return ComplaintModel.countDocuments(query);
}

export interface ComplaintStats {
  total: number;
  by_status: { status: string; count: number }[];
  by_tag: { tag: string; count: number }[];
}

const DEFAULT_TAG_LIMIT = 20;

export async function aggregate(options: { tagLimit?: number } = {}): Promise<ComplaintStats> {
  await getConnection();
  const tagLimit = options.tagLimit ?? DEFAULT_TAG_LIMIT;
  const result = await ComplaintModel.aggregate<
    { by_status: { _id: string; count: number }[]; by_tag: { _id: string; count: number }[]; total: { total: number }[] }
  >([
    {
      $facet: {
        by_status: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        by_tag: [
          { $unwind: "$tags" },
          { $group: { _id: "$tags", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: tagLimit },
        ],
        total: [{ $count: "total" }],
      },
    },
  ]);
  const facet = result[0];
  return {
    total: facet?.total[0]?.total ?? 0,
    by_status: (facet?.by_status ?? []).map((s) => ({ status: s._id, count: s.count })),
    by_tag: (facet?.by_tag ?? []).map((t) => ({ tag: t._id, count: t.count })),
  };
}
