import { getConnection } from "../db";
import { ComplaintModel } from "../../models/Complaint";
import type {
  ComplaintDocument,
  OfficialResponsePayload,
  OfficialResponseReplyPayload,
} from "../../models/Complaint";
import { ComplaintStatus } from "../../types/complaint";
import mongoose from "mongoose";

export interface FindComplaintsFilter {
  author_id?: string | null;
  status?: ComplaintStatus;
  company_id?: string;
  topic_slug?: string;
  limit?: number;
  offset?: number;
}

const MAX_SEARCH_QUERY_LENGTH = 200;

export async function create(data: {
  author_id: string | null;
  ghost_mode?: boolean;
  title: string;
  companyId?: string | null;
  companyName?: string | null;
  companySlug?: string | null;
  content: string;
  attachments?: string[];
  ai_summary?: string | null;
  tags: string[];
  topic_slug?: string | null;
  topic_title?: string | null;
  status?: ComplaintStatus;
  location?: import("../../models/Complaint").ComplaintLocation | null;
}): Promise<ComplaintDocument> {
  await getConnection();
  const doc = await ComplaintModel.create({
    ...data,
    attachments: data.attachments ?? [],
    status: data.status ?? ComplaintStatus.PENDING,
  });
  return doc.toObject() as ComplaintDocument;
}

export async function find(filter: FindComplaintsFilter = {}): Promise<ComplaintDocument[]> {
  await getConnection();
  const { author_id, status, company_id, limit = 50, offset = 0 } = filter;
  const query: Record<string, unknown> = {};
  if (author_id !== undefined) query.author_id = author_id;
  if (company_id) {
    query.$or = [
      { companyId: company_id },
      { "officialResponses.companyId": company_id },
      { tags: { $in: [company_id] } },
    ];
  }
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
  const { author_id, status, company_id, topic_slug, limit = 50, offset = 0 } = filter;
  const match: Record<string, unknown> = {};
  if (author_id !== undefined) match.author_id = author_id;
  if (company_id) {
    match.$or = [
      { companyId: company_id },
      { "officialResponses.companyId": company_id },
      { tags: { $in: [company_id] } },
    ];
  }
  if (topic_slug) match.topic_slug = topic_slug.toLowerCase().trim();
  if (status !== undefined) {
    match.status = status;
  } else if (author_id !== undefined && author_id !== null) {
    /* Feed do próprio autor (ex. mobile `author=me`): incluir pending_review. */
  } else {
    match.status = { $ne: ComplaintStatus.PENDING_REVIEW };
  }

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

export async function findAll(options: { limit?: number } = {}): Promise<ComplaintDocument[]> {
  const limit = Math.min(5000, Math.max(1, options.limit ?? 500));
  await getConnection();
  const docs = await ComplaintModel.find({})
    .sort({ created_at: -1 })
    .limit(limit)
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
  companyId?: string;
  limit?: number;
}

export async function search(
  options: SearchComplaintsOptions
): Promise<ComplaintDocument[]> {
  await getConnection();
  const { q, companyId, limit = 20 } = options;
  const trimmed = q.trim().slice(0, MAX_SEARCH_QUERY_LENGTH);
  if (!trimmed) return [];
  const textMatch: Record<string, unknown> = {
    $text: { $search: trimmed },
    status: { $ne: ComplaintStatus.PENDING_REVIEW },
  };
  if (companyId) {
    textMatch.$or = [
      { companyId },
      { "officialResponses.companyId": companyId },
      { tags: { $in: [companyId] } },
    ];
  }
  const pipeline: mongoose.PipelineStage[] = [
    { $match: textMatch },
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
        textScore: { $meta: "textScore" },
      },
    },
    { $sort: { textScore: -1, created_at: -1 } },
    { $limit: limit },
    {
      $project: {
        author_docs: 0,
        textScore: 0,
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
  const docs = await ComplaintModel.find({ "officialResponses.companyOwnerUserId": companyUserId })
    .sort({ created_at: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
  return docs as ComplaintDocument[];
}

export async function findByCompanyId(
  companyId: string,
  options: {
    limit?: number;
    offset?: number;
    q?: string;
    status?: string;
    city?: string;
    tab?: "latest" | "unanswered" | "responded" | "rated";
  } = {}
): Promise<ComplaintDocument[]> {
  await getConnection();
  const { limit = 50, offset = 0, q, status, city, tab = "latest" } = options;
  const query: Record<string, unknown> = {
    status: { $ne: ComplaintStatus.PENDING_REVIEW },
  };
  const andFilters: Record<string, unknown>[] = [];
  if (status) query.status = status;
  if (city) query["location.city"] = { $regex: city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  if (q && q.trim()) {
    const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    andFilters.push({
      $or: [
      { content: { $regex: safe, $options: "i" } },
      { tags: { $elemMatch: { $regex: safe, $options: "i" } } },
      ],
    });
  }
  if (tab === "unanswered") query.officialResponses = { $size: 0 };
  if (tab === "responded") query["officialResponses.0"] = { $exists: true };
  if (tab === "rated") query.status = { $in: [ComplaintStatus.RESOLVED, ComplaintStatus.ARCHIVED] };
  andFilters.push({
    $or: [
      { officialResponses: { $elemMatch: { companyId } } },
      { tags: { $in: [companyId] } },
    ],
  });
  const docs = await ComplaintModel.find({
    ...query,
    ...(andFilters.length > 0 ? { $and: andFilters } : {}),
  })
    .sort({ created_at: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
  return docs as ComplaintDocument[];
}

/** Métricas de reputação (mesma associação empresa que `findByCompanyId` sem `companyId` no doc). */
export async function aggregateReputationForCompany(companyId: string): Promise<{
  total: number;
  responded: number;
  solved: number;
  ratedEligible: number;
}> {
  await getConnection();
  const baseMatch = {
    status: { $ne: ComplaintStatus.PENDING_REVIEW },
    $or: [
      { companyId },
      { officialResponses: { $elemMatch: { companyId } } },
      { tags: { $in: [companyId] } },
    ],
  };
  const [row] = await ComplaintModel.aggregate<{
    total: number;
    responded: number;
    solved: number;
    ratedEligible: number;
  }>([
    { $match: baseMatch },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        responded: {
          $sum: {
            $cond: [{ $gt: [{ $size: { $ifNull: ["$officialResponses", []] } }, 0] }, 1, 0],
          },
        },
        solved: {
          $sum: { $cond: [{ $eq: ["$status", ComplaintStatus.RESOLVED] }, 1, 0] },
        },
        ratedEligible: {
          $sum: {
            $cond: [
              { $in: ["$status", [ComplaintStatus.RESOLVED, ComplaintStatus.ARCHIVED]] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  if (!row) return { total: 0, responded: 0, solved: 0, ratedEligible: 0 };
  return {
    total: row.total,
    responded: row.responded,
    solved: row.solved,
    ratedEligible: row.ratedEligible,
  };
}

export async function findPublicPaginated(
  page: number,
  limit: number,
  options?: { companyId?: string; topicSlug?: string }
): Promise<{ complaints: ComplaintDocument[]; hasMore: boolean }> {
  await getConnection();
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Math.max(1, Math.min(100, Math.floor(Number.isFinite(limit) ? limit : 10)));
  const skip = (safePage - 1) * safeLimit;
  const query: Record<string, unknown> = { status: { $ne: ComplaintStatus.PENDING_REVIEW } };
  if (options?.topicSlug) {
    query.topic_slug = options.topicSlug.toLowerCase().trim();
  }
  if (options?.companyId) {
    query.$or = [
      { companyId: options.companyId },
      { "officialResponses.companyId": options.companyId },
      { tags: { $in: [options.companyId] } },
    ];
  }
  const docs = await ComplaintModel.find(query)
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
  data: Partial<
    Pick<
      ComplaintDocument,
      | "content"
      | "ai_summary"
      | "tags"
      | "status"
      | "author_id"
      | "officialResponses"
      | "final_rating"
      | "companyId"
      | "companyName"
      | "companySlug"
      | "title"
      | "attachments"
      | "edited_at"
    >
  >
): Promise<ComplaintDocument | null> {
  await getConnection();
  const doc = await ComplaintModel.findByIdAndUpdate(
    id,
    { ...data, updated_at: new Date() },
    { new: true }
  ).lean();
  return doc as ComplaintDocument | null;
}

export async function addOfficialResponse(
  complaintId: string,
  payload: OfficialResponsePayload
): Promise<ComplaintDocument | null> {
  await getConnection();
  const doc = await ComplaintModel.findByIdAndUpdate(
    complaintId,
    { $push: { officialResponses: payload }, $set: { updated_at: new Date() } },
    { new: true }
  ).lean();
  return doc as ComplaintDocument | null;
}

export async function addOfficialResponseReply(
  complaintId: string,
  responseId: string,
  payload: OfficialResponseReplyPayload
): Promise<ComplaintDocument | null> {
  await getConnection();
  const doc = await ComplaintModel.findOneAndUpdate(
    { _id: complaintId, "officialResponses.id": responseId },
    {
      $push: { "officialResponses.$.replies": payload },
      $set: { updated_at: new Date() },
    },
    { new: true }
  ).lean();
  return doc as ComplaintDocument | null;
}

export async function updateOfficialResponseReply(
  complaintId: string,
  responseId: string,
  replyId: string,
  content: string
): Promise<ComplaintDocument | null> {
  await getConnection();
  if (!mongoose.Types.ObjectId.isValid(complaintId)) return null;
  const doc = await ComplaintModel.findOneAndUpdate(
    { _id: complaintId },
    {
      $set: {
        "officialResponses.$[or].replies.$[rep].content": content,
        updated_at: new Date(),
      },
    },
    {
      new: true,
      arrayFilters: [{ "or.id": responseId }, { "rep.id": replyId }],
    }
  ).lean();
  return doc as ComplaintDocument | null;
}

export async function removeOfficialResponseReplies(
  complaintId: string,
  responseId: string,
  replyIds: string[]
): Promise<ComplaintDocument | null> {
  await getConnection();
  if (!mongoose.Types.ObjectId.isValid(complaintId) || replyIds.length === 0) return null;
  const doc = await ComplaintModel.findOneAndUpdate(
    { _id: complaintId, "officialResponses.id": responseId },
    {
      $pull: { "officialResponses.$.replies": { id: { $in: replyIds } } },
      $set: { updated_at: new Date() },
    },
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

export async function deleteAll(): Promise<number> {
  await getConnection();
  const res = await ComplaintModel.deleteMany({});
  return res.deletedCount ?? 0;
}

export async function setFinalRating(id: string, rating: number): Promise<ComplaintDocument | null> {
  await getConnection();
  const doc = await ComplaintModel.findByIdAndUpdate(
    id,
    { $set: { final_rating: rating, updated_at: new Date() } },
    { new: true }
  ).lean();
  return doc as ComplaintDocument | null;
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
const AGGREGATE_STATS_WINDOW_DAYS = 90;

export async function aggregate(options: { tagLimit?: number } = {}): Promise<ComplaintStats> {
  await getConnection();
  const tagLimit = options.tagLimit ?? DEFAULT_TAG_LIMIT;
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - AGGREGATE_STATS_WINDOW_DAYS);
  windowStart.setHours(0, 0, 0, 0);
  const result = await ComplaintModel.aggregate<
    { by_status: { _id: string; count: number }[]; by_tag: { _id: string; count: number }[]; total: { total: number }[] }
  >([
    { $match: { created_at: { $gte: windowStart } } },
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

export async function getTopCompaniesByAgility(limit = 5): Promise<
  { companyId: string; companyName: string; companySlug: string | null; avgHours: number }[]
> {
  await getConnection();
  const result = await ComplaintModel.aggregate<{
    companyId: string;
    companyName: string;
    companySlug: string | null;
    avgHours: number;
  }>([
    { $match: { "officialResponses.0": { $exists: true } } },
    { $unwind: "$officialResponses" },
    {
      $addFields: {
        responseHours: {
          $divide: [
            { $subtract: ["$officialResponses.createdAt", "$created_at"] },
            1000 * 60 * 60,
          ],
        },
      },
    },
    {
      $group: {
        _id: {
          companyId: "$officialResponses.companyId",
          companyName: "$officialResponses.companyName",
        },
        companySlug: { $first: "$officialResponses.companySlug" },
        avgHours: { $avg: "$responseHours" },
      },
    },
    { $sort: { avgHours: 1 } },
    { $limit: Math.max(1, Math.min(20, limit)) },
    {
      $project: {
        _id: 0,
        companyId: "$_id.companyId",
        companyName: "$_id.companyName",
        companySlug: 1,
        avgHours: { $round: ["$avgHours", 2] },
      },
    },
  ]);
  return result;
}

export async function getTopCompaniesByApproval(limit = 5): Promise<
  { companyId: string; companyName: string; companySlug: string | null; approvalRate: number }[]
> {
  await getConnection();
  const result = await ComplaintModel.aggregate<{
    companyId: string;
    companyName: string;
    companySlug: string | null;
    approvalRate: number;
  }>([
    { $match: { "officialResponses.0": { $exists: true } } },
    { $unwind: "$officialResponses" },
    {
      $group: {
        _id: {
          companyId: "$officialResponses.companyId",
          companyName: "$officialResponses.companyName",
        },
        companySlug: { $first: "$officialResponses.companySlug" },
        total: { $sum: 1 },
        solved: {
          $sum: {
            $cond: [{ $eq: ["$status", ComplaintStatus.RESOLVED] }, 1, 0],
          },
        },
      },
    },
    {
      $addFields: {
        approvalRate: {
          $cond: [
            { $eq: ["$total", 0] },
            0,
            { $multiply: [{ $divide: ["$solved", "$total"] }, 100] },
          ],
        },
      },
    },
    { $sort: { approvalRate: -1 } },
    { $limit: Math.max(1, Math.min(20, limit)) },
    {
      $project: {
        _id: 0,
        companyId: "$_id.companyId",
        companyName: "$_id.companyName",
        companySlug: 1,
        approvalRate: { $round: ["$approvalRate", 2] },
      },
    },
  ]);
  return result;
}

export async function getBottomCompaniesByApproval(limit = 5): Promise<
  { companyId: string; companyName: string; companySlug: string | null; approvalRate: number }[]
> {
  await getConnection();
  const result = await ComplaintModel.aggregate<{
    companyId: string;
    companyName: string;
    companySlug: string | null;
    approvalRate: number;
  }>([
    { $match: { "officialResponses.0": { $exists: true } } },
    { $unwind: "$officialResponses" },
    {
      $group: {
        _id: {
          companyId: "$officialResponses.companyId",
          companyName: "$officialResponses.companyName",
        },
        companySlug: { $first: "$officialResponses.companySlug" },
        total: { $sum: 1 },
        solved: {
          $sum: {
            $cond: [{ $eq: ["$status", ComplaintStatus.RESOLVED] }, 1, 0],
          },
        },
      },
    },
    {
      $addFields: {
        approvalRate: {
          $cond: [
            { $eq: ["$total", 0] },
            0,
            { $multiply: [{ $divide: ["$solved", "$total"] }, 100] },
          ],
        },
      },
    },
    { $sort: { approvalRate: 1 } },
    { $limit: Math.max(1, Math.min(20, limit)) },
    {
      $project: {
        _id: 0,
        companyId: "$_id.companyId",
        companyName: "$_id.companyName",
        companySlug: 1,
        approvalRate: { $round: ["$approvalRate", 2] },
      },
    },
  ]);
  return result;
}

export async function getCompaniesInvolvedRageMeterLast72h(limit = 10): Promise<
  { companyId: string; companyName: string; companySlug: string | null; count: number }[]
> {
  await getConnection();
  const start = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const result = await ComplaintModel.aggregate<{
    companyId: string;
    companyName: string;
    companySlug: string | null;
    count: number;
  }>([
    { $match: { "officialResponses.0": { $exists: true } } },
    { $unwind: "$officialResponses" },
    { $match: { "officialResponses.createdAt": { $gte: start } } },
    {
      $group: {
        _id: {
          companyId: "$officialResponses.companyId",
          companyName: "$officialResponses.companyName",
        },
        companySlug: { $first: "$officialResponses.companySlug" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: Math.max(1, Math.min(50, limit)) },
    {
      $project: {
        _id: 0,
        companyId: "$_id.companyId",
        companyName: "$_id.companyName",
        companySlug: 1,
        count: 1,
      },
    },
  ]);
  return result;
}

export async function getTopComplainedCompaniesLast72h(limit = 5): Promise<
  { companyId: string; companyName: string; companySlug: string | null; count: number }[]
> {
  await getConnection();
  const start = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const result = await ComplaintModel.aggregate<{
    companyId: string;
    companyName: string;
    companySlug: string | null;
    count: number;
  }>([
    { $match: { created_at: { $gte: start }, "officialResponses.0": { $exists: true } } },
    { $unwind: "$officialResponses" },
    {
      $group: {
        _id: {
          companyId: "$officialResponses.companyId",
          companyName: "$officialResponses.companyName",
        },
        companySlug: { $first: "$officialResponses.companySlug" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: Math.max(1, Math.min(20, limit)) },
    {
      $project: {
        _id: 0,
        companyId: "$_id.companyId",
        companyName: "$_id.companyName",
        companySlug: 1,
        count: 1,
      },
    },
  ]);
  return result;
}

export async function getRecentComplaintsSince(date: Date, limit = 200): Promise<ComplaintDocument[]> {
  await getConnection();
  const docs = await ComplaintModel.find({ created_at: { $gte: date } })
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();
  return docs as ComplaintDocument[];
}

export async function getRecentCompanyInteractions(limit = 3): Promise<
  { complaintId: string; companyName: string; createdAt: Date; text: string }[]
> {
  await getConnection();
  const result = await ComplaintModel.aggregate<{
    complaintId: string;
    companyName: string;
    createdAt: Date;
    text: string;
  }>([
    { $match: { "officialResponses.0": { $exists: true } } },
    { $unwind: "$officialResponses" },
    { $sort: { "officialResponses.createdAt": -1 } },
    { $limit: Math.max(1, Math.min(20, limit)) },
    {
      $project: {
        _id: 0,
        complaintId: { $toString: "$_id" },
        companyName: "$officialResponses.companyName",
        createdAt: "$officialResponses.createdAt",
        text: "$officialResponses.content",
      },
    },
  ]);
  return result;
}

export async function getOverallCompanyStats(): Promise<{
  avgResponseHours: number;
  solutionIndex: number;
}> {
  await getConnection();
  const result = await ComplaintModel.aggregate<{
    avgResponseHours: number;
    solutionIndex: number;
  }>([
    { $match: { "officialResponses.0": { $exists: true } } },
    {
      $addFields: {
        firstResponseAt: { $min: "$officialResponses.createdAt" },
      },
    },
    {
      $addFields: {
        responseHours: {
          $divide: [
            { $subtract: ["$firstResponseAt", "$created_at"] },
            1000 * 60 * 60,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        solved: {
          $sum: {
            $cond: [{ $eq: ["$status", ComplaintStatus.RESOLVED] }, 1, 0],
          },
        },
        avgResponseHours: { $avg: "$responseHours" },
      },
    },
    {
      $addFields: {
        solutionIndex: {
          $cond: [
            { $eq: ["$total", 0] },
            0,
            { $multiply: [{ $divide: ["$solved", "$total"] }, 100] },
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
        avgResponseHours: { $round: ["$avgResponseHours", 2] },
        solutionIndex: { $round: ["$solutionIndex", 2] },
      },
    },
  ]);

  const row = result[0];
  return {
    avgResponseHours: Number(row?.avgResponseHours ?? 0),
    solutionIndex: Number(row?.solutionIndex ?? 0),
  };
}

export async function getCompanyPerformanceStats(companyId: string): Promise<{
  avgResponseHours: number;
  solutionIndex: number;
}> {
  await getConnection();
  const result = await ComplaintModel.aggregate<{
    avgResponseHours: number;
    solutionIndex: number;
  }>([
    { $match: { "officialResponses.companyId": companyId } },
    {
      $project: {
        status: 1,
        created_at: 1,
        officialResponses: {
          $filter: {
            input: "$officialResponses",
            as: "r",
            cond: { $eq: ["$$r.companyId", companyId] },
          },
        },
      },
    },
    {
      $addFields: {
        firstResponseAt: { $min: "$officialResponses.createdAt" },
      },
    },
    {
      $addFields: {
        responseHours: {
          $divide: [
            { $subtract: ["$firstResponseAt", "$created_at"] },
            1000 * 60 * 60,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        solved: {
          $sum: {
            $cond: [{ $eq: ["$status", ComplaintStatus.RESOLVED] }, 1, 0],
          },
        },
        avgResponseHours: { $avg: "$responseHours" },
      },
    },
    {
      $addFields: {
        solutionIndex: {
          $cond: [
            { $eq: ["$total", 0] },
            0,
            { $multiply: [{ $divide: ["$solved", "$total"] }, 100] },
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
        avgResponseHours: { $round: ["$avgResponseHours", 2] },
        solutionIndex: { $round: ["$solutionIndex", 2] },
      },
    },
  ]);

  const row = result[0];
  return {
    avgResponseHours: Number(row?.avgResponseHours ?? 0),
    solutionIndex: Number(row?.solutionIndex ?? 0),
  };
}
