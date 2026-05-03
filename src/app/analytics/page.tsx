import type { Metadata } from "next";
import * as complaintService from "../../lib/complaintService";
import * as analyticsService from "../../lib/services/analytics";
import { AnalyticsView } from "./view";
import type { RageMapPoint } from "../../components/complaints/RageMap";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estatísticas",
  description: "Tendências, mapa e métricas de denúncias e reputação.",
};

export default async function AnalyticsPage() {
  const [trends, stats, feed, companyReputation] = await Promise.all([
    complaintService.getWeeklyTrends(),
    complaintService.getStats(),
    complaintService.getFeed({ limit: 300 }),
    analyticsService.getOverallCompanyStats(),
  ]);

  const mapPoints: RageMapPoint[] = feed
    .filter((c) => c.location && typeof c.location.lat === "number" && typeof c.location.lng === "number")
    .map((c) => ({
      id: c.id,
      lat: c.location!.lat,
      lng: c.location!.lng,
      city: c.location!.city,
      intensity: 0.7,
    }));

  const complaintRows = feed.map((c) => ({
    id: c.id,
    title: c.title ?? "Sem título",
    status: c.status,
    companyName: c.companyName ?? null,
    city: c.location?.city ?? null,
    content: c.content,
    createdAtLabel: c.created_at_label,
    attachments: c.attachments ?? [],
  }));

  return (
    <AnalyticsView
      trends={trends}
      total={stats.total}
      mapPoints={mapPoints}
      companyReputation={companyReputation}
      complaints={complaintRows}
    />
  );
}