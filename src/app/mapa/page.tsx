import type { Metadata } from "next";
import { MapPinned, TrendingUp } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import * as complaintRepository from "../../lib/repositories/complaintRepository";
import { ComplaintStatus } from "../../types/complaint";
import { RageMapNoSSR } from "../../components/complaints/RageMapNoSSR";
import type { RageMapPoint } from "../../components/complaints/RageMap";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import * as analyticsService from "../../lib/services/analytics";
import { getI18n } from "../../lib/i18n/request";
import { getMessage } from "../../lib/i18n/dict";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Radar de transparência",
  description: "Mapa de denúncias e rankings de empresas.",
};

function intensityForStatus(status: string): number {
  if (status === ComplaintStatus.PENDING_REVIEW) return 1.0;
  if (status === ComplaintStatus.PENDING) return 0.8;
  if (status === ComplaintStatus.REVIEWED) return 0.7;
  if (status === ComplaintStatus.RESOLVED) return 0.55;
  return 0.6;
}

export default async function MapaPage() {
  const { messages } = await getI18n();
  const tr = (key: string) => getMessage(messages, key);
  const [docs, leaderboards] = await Promise.all([
    complaintRepository.findAll({ limit: 3000 }),
    analyticsService.getLeaderboards(),
  ]);
  const points: RageMapPoint[] = docs
    .filter((c) => c.location && typeof c.location.lat === "number" && typeof c.location.lng === "number")
    .map((c) => ({
      id: String(c._id),
      lat: c.location!.lat,
      lng: c.location!.lng,
      city: c.location!.city,
      intensity: intensityForStatus(String(c.status)),
    }));

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <PageHeader title={tr("mapa.title")} iconName="mapPinned" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <RageMapNoSSR points={points} className="h-[45vh]" />
          </div>
          <Card className="bg-zinc-950/40 ring-zinc-800/80">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-zinc-100">
                <TrendingUp className="h-4 w-4 text-emerald-300" />
                {tr("mapa.topAgility")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {leaderboards.fastest.map((item, idx) => (
                  <li key={`${item.companyId}-${idx}`} className="flex items-center justify-between gap-2">
                    <span className="text-zinc-200">{item.companyName}</span>
                    <span className="tabular-nums text-emerald-300">
                      {tr("mapa.respondsIn")} {item.avgHours.toFixed(1)}h
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="bg-zinc-950/40 ring-zinc-800/80">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-zinc-100">
                <TrendingUp className="h-4 w-4 text-emerald-300" />
                {tr("mapa.topApproval")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {leaderboards.approval.map((item, idx) => (
                  <li key={`${item.companyId}-${idx}`} className="flex items-center justify-between gap-2">
                    <span className="text-zinc-200">{item.companyName}</span>
                    <span className="tabular-nums text-emerald-300">{item.approvalRate.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
