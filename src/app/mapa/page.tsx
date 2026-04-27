import Link from "next/link";
import { ArrowLeft, MapPinned } from "lucide-react";
import * as complaintRepository from "../../lib/repositories/complaintRepository";
import { ComplaintStatus } from "../../types/complaint";
import { RageMap, type RageMapPoint } from "../../components/complaints/RageMap";

function intensityForStatus(status: string): number {
  if (status === ComplaintStatus.PENDING_REVIEW) return 1.0;
  if (status === ComplaintStatus.PENDING) return 0.8;
  if (status === ComplaintStatus.REVIEWED) return 0.7;
  if (status === ComplaintStatus.RESOLVED) return 0.55;
  return 0.6;
}

export default async function MapaPage() {
  const docs = await complaintRepository.findAll();
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
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/70 pb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-200 ring-cyber transition hover:bg-zinc-900/45 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4 text-red-300/90" aria-hidden />
            <span>AnonComplaint</span>
          </Link>
          <h1 className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-100">
            <MapPinned className="h-4 w-4 text-red-300/90" aria-hidden />
            <span>Mapa</span>
          </h1>
        </header>

        <RageMap points={points} />
      </div>
    </div>
  );
}
