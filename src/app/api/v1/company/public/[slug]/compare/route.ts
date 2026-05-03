import * as companyService from "@/lib/companyService";
import * as analyticsService from "@/lib/services/analytics";
import { jsonData, jsonError } from "@/lib/api/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const company = await companyService.getBySlug(slug);
  if (!company) return jsonError("not_found", "Empresa não encontrada", 404);

  const [reputation, performance, overall] = await Promise.all([
    companyService.calculateReputation(company.id),
    analyticsService.getCompanyPerformance(company.id),
    analyticsService.getOverallCompanyStats(),
  ]);

  const ranking = overall.reputationRanking;
  const index = ranking.findIndex((x) => x.companyId === company.id);
  const position = index >= 0 ? index + 1 : null;
  const percentile =
    position && ranking.length > 0
      ? ((ranking.length - position + 1) / ranking.length) * 100
      : null;

  return jsonData({
    companyId: company.id,
    companyName: company.name,
    reputation: {
      score: reputation.score,
      responseRate: reputation.responseRate,
      solutionRate: reputation.solutionRate,
    },
    performance: {
      avgResponseHours: performance.avgResponseHours,
      solutionIndex: performance.solutionIndex,
    },
    position,
    percentile,
  });
}

