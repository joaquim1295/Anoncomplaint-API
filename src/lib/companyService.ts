import * as companyRepository from "./repositories/companyRepository";
import type { Company } from "../types/company";
import type { CompanyDocument } from "../models/Company";

function toCompany(doc: CompanyDocument): Company {
  return {
    id: String(doc._id),
    name: doc.name,
    website: doc.website ?? null,
    description: doc.description ?? null,
    created_at: doc.created_at,
  };
}

export async function listForUser(userId: string): Promise<Company[]> {
  const docs = await companyRepository.findByOwner(userId);
  return docs.map(toCompany);
}

export async function createForUser(
  userId: string,
  data: { name: string; website?: string | null; description?: string | null }
): Promise<Company> {
  const doc = await companyRepository.create({
    ownerUserId: userId,
    name: data.name,
    website: data.website,
    description: data.description,
  });
  return toCompany(doc);
}

export async function updateForUser(
  userId: string,
  companyId: string,
  data: { name: string; website?: string | null; description?: string | null }
): Promise<Company | null> {
  const existing = await companyRepository.findById(companyId);
  if (!existing || existing.ownerUserId !== userId) return null;
  const updated = await companyRepository.update(companyId, data);
  return updated ? toCompany(updated) : null;
}

export async function deleteForUser(userId: string, companyId: string): Promise<boolean> {
  const existing = await companyRepository.findById(companyId);
  if (!existing || existing.ownerUserId !== userId) return false;
  return companyRepository.deleteById(companyId);
}

