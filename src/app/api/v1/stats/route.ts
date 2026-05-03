import * as complaintService from "../../../../lib/complaintService";
import { jsonData } from "../../../../lib/api/http";
import { getClientIp, rateLimitOrNull, statsLimiter } from "../../../../lib/rate-limit";

export async function GET(request: Request) {
  const limited = await rateLimitOrNull(statsLimiter, getClientIp(request), "stats");
  if (limited) return limited;
  const stats = await complaintService.getStats();
  return jsonData(stats);
}

