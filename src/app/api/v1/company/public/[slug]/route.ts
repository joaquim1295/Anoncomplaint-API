import * as companyService from "@/lib/companyService";
import { jsonData, jsonError } from "@/lib/api/http";

/** Resumo público da empresa por slug (mobile / integrações). */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const raw = String(slug ?? "").trim();
  if (!raw) return jsonError("bad_request", "Slug inválido", 400);
  const company = await companyService.getBySlug(raw);
  if (!company) return jsonError("not_found", "Empresa não encontrada", 404);
  return jsonData({
    id: company.id,
    name: company.name,
    slug: company.slug,
    logo_image: company.logo_image ?? null,
    website: company.website ?? null,
    description: company.description ?? null,
    views_count: company.views_count ?? 0,
  });
}
