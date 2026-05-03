import * as companyRepository from "./repositories/companyRepository";
import * as userRepository from "./repositories/userRepository";
import type { Company } from "../types/company";
import type { CompanyDocument } from "../models/Company";
import * as complaintRepository from "./repositories/complaintRepository";

function slugifyCompanyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function makeUniqueSlug(baseName: string, exceptId?: string): Promise<string> {
  const base = slugifyCompanyName(baseName) || "empresa";
  let candidate = base;
  let idx = 1;
  while (true) {
    const existing = await companyRepository.findBySlug(candidate);
    if (!existing || String(existing._id) === exceptId) return candidate;
    idx += 1;
    candidate = `${base}-${idx}`;
  }
}

function toCompany(doc: CompanyDocument): Company {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    logo_image: doc.logo_image ?? null,
    taxId: doc.taxId ?? null,
    website: doc.website ?? null,
    description: doc.description ?? null,
    views_count: doc.views_count ?? 0,
    ownerUserId: doc.ownerUserId,
    created_at: doc.created_at,
  };
}

export async function listForUser(userId: string): Promise<Company[]> {
  const docs = await companyRepository.findByOwner(userId);
  return docs.map(toCompany);
}

export async function createForUser(
  userId: string,
  data: { name: string; logo_image?: string | null; taxId?: string | null; website?: string | null; description?: string | null }
): Promise<Company> {
  const slug = await makeUniqueSlug(data.name);
  const doc = await companyRepository.create({
    ownerUserId: userId,
    name: data.name,
    slug,
    logo_image: data.logo_image ?? null,
    taxId: data.taxId ?? null,
    website: data.website,
    description: data.description,
  });
  return toCompany(doc);
}

export async function updateForUser(
  userId: string,
  companyId: string,
  data: { name: string; logo_image?: string | null; taxId?: string | null; website?: string | null; description?: string | null }
): Promise<Company | null> {
  const existing = await companyRepository.findById(companyId);
  if (!existing || existing.ownerUserId !== userId) return null;
  const slug = data.name ? await makeUniqueSlug(data.name, companyId) : existing.slug;
  const updated = await companyRepository.update(companyId, { ...data, slug });
  return updated ? toCompany(updated) : null;
}

export async function deleteForUser(userId: string, companyId: string): Promise<boolean> {
  const existing = await companyRepository.findById(companyId);
  if (!existing || existing.ownerUserId !== userId) return false;
  return companyRepository.deleteById(companyId);
}

export async function updateAny(
  companyId: string,
  data: { name: string; logo_image?: string | null; taxId?: string | null; website?: string | null; description?: string | null }
): Promise<Company | null> {
  const existing = await companyRepository.findById(companyId);
  if (!existing) return null;
  const slug = data.name ? await makeUniqueSlug(data.name, companyId) : existing.slug;
  const updated = await companyRepository.update(companyId, { ...data, slug });
  return updated ? toCompany(updated) : null;
}

export async function deleteAny(companyId: string): Promise<boolean> {
  const existing = await companyRepository.findById(companyId);
  if (!existing) return false;
  return companyRepository.deleteById(companyId);
}

export async function getBySlug(slug: string): Promise<Company | null> {
  let doc = await companyRepository.findBySlug(slug);
  if (!doc) {
    const fallbackName = slug.replace(/-/g, " ");
    const byName = await companyRepository.findByName(fallbackName);
    if (!byName) return null;
    const resolvedSlug = byName.slug || (await makeUniqueSlug(byName.name, String(byName._id)));
    doc = byName.slug ? byName : await companyRepository.update(String(byName._id), { slug: resolvedSlug });
    if (!doc) return null;
  }
  const company = toCompany(doc);
  const owner = await userRepository.findUserById(doc.ownerUserId);
  return {
    ...company,
    ownerEmail: owner?.email,
  };
}

export async function incrementViews(slug: string): Promise<number | null> {
  const doc = await companyRepository.incrementViewsBySlug(slug);
  return doc ? doc.views_count ?? 0 : null;
}

export async function searchPublicByName(q: string, limit = 8): Promise<Pick<Company, "id" | "name" | "slug">[]> {
  const docs = await companyRepository.searchPublicByName(q, limit);
  return docs.map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
  }));
}

export interface ReputationBreakdown {
  score: number;
  responseRate: number;
  solutionRate: number;
  avgRating: number;
}

export async function calculateReputation(companyId: string): Promise<ReputationBreakdown> {
  const { total, responded, solved, ratedEligible } =
    await complaintRepository.aggregateReputationForCompany(companyId);
  if (total === 0) {
    return { score: 0, responseRate: 0, solutionRate: 0, avgRating: 0 };
  }
  const avgRating =
    ratedEligible === 0 ? 0 : Math.min(10, Math.max(0, (solved / ratedEligible) * 10));
  const responseRate = (responded / total) * 10;
  const solutionRate = (solved / total) * 10;
  const weighted = responseRate * 0.4 + solutionRate * 0.4 + avgRating * 0.2;
  return {
    score: Number(weighted.toFixed(2)),
    responseRate: Number(responseRate.toFixed(2)),
    solutionRate: Number(solutionRate.toFixed(2)),
    avgRating: Number(avgRating.toFixed(2)),
  };
}

