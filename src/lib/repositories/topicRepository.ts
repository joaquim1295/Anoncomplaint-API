import { getConnection } from "../db";
import { TopicModel } from "../../models/Topic";
import type { TopicDocument } from "../../models/Topic";

export async function findBySlug(slug: string): Promise<TopicDocument | null> {
  await getConnection();
  const doc = await TopicModel.findOne({ slug: slug.toLowerCase().trim() }).lean();
  return doc as TopicDocument | null;
}

export async function create(data: {
  slug: string;
  title: string;
  description?: string | null;
  company_id?: string | null;
}): Promise<TopicDocument> {
  await getConnection();
  const doc = await TopicModel.create({
    slug: data.slug.toLowerCase().trim(),
    title: data.title.trim(),
    description: data.description ?? null,
    company_id: data.company_id ?? null,
    complaint_count: 0,
  });
  return doc.toObject() as TopicDocument;
}

export async function listRecent(limit = 40): Promise<TopicDocument[]> {
  await getConnection();
  const docs = await TopicModel.find({})
    .sort({ complaint_count: -1, created_at: -1 })
    .limit(Math.min(100, Math.max(1, limit)))
    .lean();
  return docs as TopicDocument[];
}

export async function searchBySlugPrefix(prefix: string, limit = 12): Promise<TopicDocument[]> {
  await getConnection();
  const safe = prefix.trim().toLowerCase().slice(0, 40);
  if (!safe) return [];
  const docs = await TopicModel.find({ slug: new RegExp(`^${safe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) })
    .sort({ complaint_count: -1 })
    .limit(limit)
    .lean();
  return docs as TopicDocument[];
}

export async function incrementComplaintCount(slug: string): Promise<void> {
  await getConnection();
  await TopicModel.updateOne({ slug: slug.toLowerCase().trim() }, { $inc: { complaint_count: 1 } });
}
