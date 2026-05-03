import { getConnection } from "../db";
import { CompanyModel } from "../../models/Company";
import type { CompanyDocument } from "../../models/Company";

export async function create(data: {
  ownerUserId: string;
  name: string;
  slug: string;
  logo_image?: string | null;
  taxId?: string | null;
  website?: string | null;
  description?: string | null;
}): Promise<CompanyDocument> {
  await getConnection();
  const doc = await CompanyModel.create({
    ownerUserId: data.ownerUserId,
    name: data.name,
    slug: data.slug,
    logo_image: data.logo_image ?? null,
    taxId: data.taxId ?? null,
    website: data.website ?? null,
    description: data.description ?? null,
  });
  return doc.toObject() as CompanyDocument;
}

export async function findByOwner(ownerUserId: string): Promise<CompanyDocument[]> {
  await getConnection();
  const docs = await CompanyModel.find({ ownerUserId })
    .sort({ created_at: -1 })
    .lean();
  return docs as CompanyDocument[];
}

export async function findById(id: string): Promise<CompanyDocument | null> {
  await getConnection();
  const doc = await CompanyModel.findById(id).lean();
  return doc as CompanyDocument | null;
}

export async function findByIds(ids: string[]): Promise<CompanyDocument[]> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter((id) => /^[a-f0-9]{24}$/i.test(id)))];
  if (unique.length === 0) return [];
  await getConnection();
  const docs = await CompanyModel.find({ _id: { $in: unique } }).lean();
  return docs as CompanyDocument[];
}

export async function findBySlug(slug: string): Promise<CompanyDocument | null> {
  await getConnection();
  const doc = await CompanyModel.findOne({ slug }).lean();
  return doc as CompanyDocument | null;
}

export async function findByName(name: string): Promise<CompanyDocument | null> {
  await getConnection();
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const doc = await CompanyModel.findOne({ name: { $regex: `^${escaped}$`, $options: "i" } }).lean();
  return doc as CompanyDocument | null;
}

export async function searchPublicByName(q: string, limit = 8): Promise<CompanyDocument[]> {
  await getConnection();
  const trimmed = q.trim();
  if (!trimmed) return [];
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const docs = await CompanyModel.find({ name: { $regex: escaped, $options: "i" } })
    .sort({ views_count: -1, created_at: -1 })
    .limit(Math.max(1, Math.min(20, limit)))
    .lean();
  return docs as CompanyDocument[];
}

export async function update(
  id: string,
  data: Partial<Pick<CompanyDocument, "name" | "slug" | "logo_image" | "taxId" | "website" | "description">>
): Promise<CompanyDocument | null> {
  await getConnection();
  const doc = await CompanyModel.findByIdAndUpdate(
    id,
    {
      $set: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.logo_image !== undefined ? { logo_image: data.logo_image } : {}),
        ...(data.taxId !== undefined ? { taxId: data.taxId } : {}),
        ...(data.website !== undefined ? { website: data.website } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    },
    { new: true }
  ).lean();
  return doc as CompanyDocument | null;
}

export async function incrementViewsBySlug(slug: string): Promise<CompanyDocument | null> {
  await getConnection();
  const doc = await CompanyModel.findOneAndUpdate(
    { slug },
    { $inc: { views_count: 1 } },
    { new: true }
  ).lean();
  return doc as CompanyDocument | null;
}

export async function deleteById(id: string): Promise<boolean> {
  await getConnection();
  const res = await CompanyModel.deleteOne({ _id: id });
  return (res.deletedCount ?? 0) > 0;
}

