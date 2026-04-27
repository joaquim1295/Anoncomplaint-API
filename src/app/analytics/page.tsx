import * as complaintService from "../../lib/complaintService";
import * as complaintRepository from "../../lib/repositories/complaintRepository";
import { AnalyticsView } from "./view";
import type { RageMapPoint } from "../../components/complaints/RageMap";

function intensityForStatus(status: string): number {
  if (status === "pending_review") return 1.0;
  if (status === "pending") return 0.8;
  if (status === "reviewed") return 0.7;
  if (status === "resolved") return 0.55;
  return 0.6;
}

export default async function AnalyticsPage() {
  const [trends, stats, docs] = await Promise.all([
    complaintService.getWeeklyTrends(),
    complaintService.getStats(),
    complaintRepository.findAll(),
  ]);
  const mapPoints: RageMapPoint[] = docs
    .filter((c) => c.location && typeof c.location.lat === "number" && typeof c.location.lng === "number")
    .map((c) => ({
      id: String(c._id),
      lat: c.location!.lat,
      lng: c.location!.lng,
      city: c.location!.city,
      intensity: intensityForStatus(String(c.status)),
    }));
  return (
    <AnalyticsView
      trends={trends}
      total={stats.total}
      mapPoints={mapPoints}
    />
  );
}
