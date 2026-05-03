import * as companyService from "@/lib/companyService";
import { jsonData, jsonError } from "@/lib/api/http";
import { triggerRealtimeEvent } from "@/lib/realtime/pusher-server";
import { companyPublicViewLimiter, getClientIp, rateLimitOrNull } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const limited = await rateLimitOrNull(companyPublicViewLimiter, getClientIp(request), "companyPublicView");
  if (limited) return limited;
  const { slug } = await params;
  const views = await companyService.incrementViews(slug);
  if (views === null) return jsonError("not_found", "Empresa não encontrada", 404);
  await triggerRealtimeEvent(`company-${slug}`, "views-updated", { views });
  return jsonData({ slug, views });
}

