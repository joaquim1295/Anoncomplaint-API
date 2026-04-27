import { getConnection } from "../db";
import { CompanyModel } from "../../models/Company";
import type { CompanyDocument } from "../../models/Company";

export async function create(data: {
  ownerUserId: string;
  name: string;
  website?: string | null;
  description?: string | null;
}): Promise<CompanyDocument> {
  await getConnection();
  const doc = await CompanyModel.create({
    ownerUserId: data.ownerUserId,
    name: data.name,
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

export async function update(
  id: string,
  data: Partial<Pick<CompanyDocument, "name" | "website" | "description">>
): Promise<CompanyDocument | null> {
  await getConnection();
  const doc = await CompanyModel.findByIdAndUpdate(
    id,
    {
      $set: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.website !== undefined ? { website: data.website } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    },
    { new: true }
  ).lean();
  return doc as CompanyDocument | null;
}

export async function deleteById(id: string): Promise<boolean> {
  await getConnection();
  const res = await CompanyModel.deleteOne({ _id: id });
  return (res.deletedCount ?? 0) > 0;
}

