import { jsonData } from "@/lib/api/http";
import * as companyService from "@/lib/companyService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") ?? "").trim();
  const data = q ? await companyService.searchPublicByName(q, 8) : [];
  return jsonData(data);
}

