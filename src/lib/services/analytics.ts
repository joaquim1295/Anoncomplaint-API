import { unstable_cache } from "next/cache";
import * as complaintRepository from "../repositories/complaintRepository";

const COMPLAINT_AGGREGATE_TAG = "complaint-aggregate" as const;
const ANALYTICS_CACHE_SECONDS = 120;

interface FastestItem {
  companyId: string;
  companyName: string;
  companySlug: string | null;
  avgHours: number;
}

interface ApprovalItem {
  companyId: string;
  companyName: string;
  companySlug: string | null;
  approvalRate: number;
}

export async function getLeaderboards(): Promise<{
  fastest: FastestItem[];
  approval: ApprovalItem[];
}> {
  const load = async () => {
    const [fastest, approval] = await Promise.all([
      complaintRepository.getTopCompaniesByAgility(5),
      complaintRepository.getTopCompaniesByApproval(5),
    ]);
    return { fastest, approval };
  };
  try {
    return await unstable_cache(load, ["analytics-leaderboards"], {
      revalidate: ANALYTICS_CACHE_SECONDS,
      tags: [COMPLAINT_AGGREGATE_TAG],
    })();
  } catch {
    return load();
  }
}

export async function getCompanyPerformance(companyId: string): Promise<{
  avgResponseHours: number;
  solutionIndex: number;
}> {
  return complaintRepository.getCompanyPerformanceStats(companyId);
}

export type CompanyReputationRankingItem = {
  companyId: string;
  companyName: string;
  companySlug: string | null;
  reputationScore: number;
  avgResponseHours: number;
  approvalRate: number;
};

export async function getOverallCompanyStats(): Promise<{
  avgResponseHours: number;
  solutionIndex: number;
  reputationRanking: CompanyReputationRankingItem[];
  mostAgile: FastestItem[];
  mostCredible: ApprovalItem[];
  leastCredible: ApprovalItem[];
}> {
  const load = async () => {
  const [overall, mostAgile, mostCredible, leastCredible] = await Promise.all([
    complaintRepository.getOverallCompanyStats(),
    complaintRepository.getTopCompaniesByAgility(5),
    complaintRepository.getTopCompaniesByApproval(5),
    complaintRepository.getBottomCompaniesByApproval(5),
  ]);

  const hoursValues = mostAgile.map((x) => x.avgHours);
  const minHours = hoursValues.length > 0 ? Math.min(...hoursValues) : 0;
  const maxHours = hoursValues.length > 0 ? Math.max(...hoursValues) : 0;

  const approvalValues = mostCredible.map((x) => x.approvalRate).concat(leastCredible.map((x) => x.approvalRate));
  const minApproval = approvalValues.length > 0 ? Math.min(...approvalValues) : 0;
  const maxApproval = approvalValues.length > 0 ? Math.max(...approvalValues) : 100;

  const allCompaniesMap = new Map<
    string,
    { companyName: string; companySlug: string | null; avgResponseHours?: number; approvalRate?: number }
  >();
  for (const a of mostAgile) {
    allCompaniesMap.set(a.companyId, {
      companyName: a.companyName,
      companySlug: a.companySlug ?? null,
      avgResponseHours: a.avgHours,
    });
  }
  for (const a of mostCredible) {
    const existing = allCompaniesMap.get(a.companyId);
    allCompaniesMap.set(a.companyId, {
      companyName: existing?.companyName ?? a.companyName,
      companySlug: existing?.companySlug ?? a.companySlug ?? null,
      avgResponseHours: existing?.avgResponseHours,
      approvalRate: a.approvalRate,
    });
  }
  for (const a of leastCredible) {
    const existing = allCompaniesMap.get(a.companyId);
    allCompaniesMap.set(a.companyId, {
      companyName: existing?.companyName ?? a.companyName,
      companySlug: existing?.companySlug ?? a.companySlug ?? null,
      avgResponseHours: existing?.avgResponseHours,
      approvalRate: a.approvalRate,
    });
  }

  const ranking: CompanyReputationRankingItem[] = [];
  for (const [companyId, v] of allCompaniesMap.entries()) {
    const avgResponseHours = v.avgResponseHours ?? 0;
    const approvalRate = v.approvalRate ?? 0;

    const normalizedAgility =
      maxHours - minHours > 0 ? (maxHours - avgResponseHours) / (maxHours - minHours) : 0;
    const normalizedCredibility =
      maxApproval - minApproval > 0
        ? (approvalRate - minApproval) / (maxApproval - minApproval)
        : 0;

    const reputationScore = normalizedAgility * 0.4 + normalizedCredibility * 0.6;
    ranking.push({
      companyId,
      companyName: v.companyName,
      companySlug: v.companySlug ?? null,
      reputationScore: Number((reputationScore * 100).toFixed(2)),
      avgResponseHours,
      approvalRate,
    });
  }

  ranking.sort((a, b) => b.reputationScore - a.reputationScore);

  return {
    avgResponseHours: overall.avgResponseHours,
    solutionIndex: overall.solutionIndex,
    reputationRanking: ranking,
    mostAgile,
    mostCredible,
    leastCredible,
  };
  };
  try {
    return await unstable_cache(load, ["analytics-overall-company-stats"], {
      revalidate: ANALYTICS_CACHE_SECONDS,
      tags: [COMPLAINT_AGGREGATE_TAG],
    })();
  } catch {
    return load();
  }
}

export async function getTopComplainedCompaniesLast72h() {
  return complaintRepository.getTopComplainedCompaniesLast72h(5);
}

export async function getTrendingTopicsLast72h(): Promise<{ tag: string; count: number }[]> {
  const docs = await complaintRepository.getRecentComplaintsSince(
    new Date(Date.now() - 72 * 60 * 60 * 1000),
    300
  );
  const map = new Map<string, number>();
  for (const doc of docs) {
    const matches = (doc.content ?? "").match(/#[\p{L}\p{N}_-]+/gu) ?? [];
    for (const raw of matches) {
      const t = raw.toLowerCase();
      map.set(t, (map.get(t) ?? 0) + 1);
    }
    for (const tag of doc.tags ?? []) {
      const normalized = `#${String(tag).trim().toLowerCase().replace(/\s+/g, "_")}`;
      if (normalized !== "#") map.set(normalized, (map.get(normalized) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));
}

export async function getRecentCompanyInteractions() {
  return complaintRepository.getRecentCompanyInteractions(3);
}

export async function getCompaniesRageMeterLast72h(limit = 10): Promise<
  { companyId: string; companyName: string; count: number }[]
> {
  return complaintRepository.getCompaniesInvolvedRageMeterLast72h(limit);
}

