import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";
import { getCurrentUser } from "../../lib/getUser";
import * as complaintService from "../../lib/complaintService";
import { DashboardEmpresaView } from "./view";

export default async function DashboardEmpresaPage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  const complaints = await complaintService.getFeedByCompanyUserId(user.userId, {
    limit: 100,
    offset: 0,
  });

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/70 pb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-200 ring-cyber transition hover:bg-zinc-900/45 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-300/90" aria-hidden />
            <span>AnonComplaint</span>
          </Link>
          <h1 className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-100">
            <BriefcaseBusiness className="h-4 w-4 text-emerald-300/90" aria-hidden />
            <span>Dashboard da Empresa</span>
          </h1>
        </header>
        <DashboardEmpresaView complaints={complaints} />
      </div>
    </div>
  );
}
