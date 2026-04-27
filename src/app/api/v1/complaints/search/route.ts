import * as complaintService from "../../../../../lib/complaintService";
import { jsonData, jsonError, parsePagination } from "../../../../../lib/api/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) return jsonError("validation_error", "Query parameter 'q' is required", 400);
  const { page, limit } = parsePagination(url.searchParams);
  const docs = await complaintService.searchComplaints(q, { limit });
  const hasMore = docs.length === limit;
  return jsonData(docs, undefined, { page, limit, hasMore });
}

