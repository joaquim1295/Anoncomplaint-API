"use client";

import type { ComplaintDisplay } from "../../types/complaint";
import { CompanyComplaintManager } from "../../components/dashboard/CompanyComplaintManager";

export function DashboardEmpresaView({ complaints }: { complaints: ComplaintDisplay[] }) {
  return <CompanyComplaintManager complaints={complaints} />;
}
