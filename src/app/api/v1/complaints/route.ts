import * as complaintService from "../../../../lib/complaintService";
import { getApiSession } from "../../../../lib/api/auth";
import { jsonData, jsonError, parsePagination } from "../../../../lib/api/http";
import { complaintCreateLimiter, getClientIp, rateLimitOrNull } from "../../../../lib/rate-limit";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { page, limit, offset } = parsePagination(url.searchParams);
  const company = String(url.searchParams.get("company") ?? "").trim();
  const topic = String(url.searchParams.get("topic") ?? "").trim().toLowerCase();
  const authorMe = String(url.searchParams.get("author") ?? "").trim().toLowerCase() === "me";
  const session = await getApiSession(request);
  const authorId =
    authorMe && session ? session.userId : authorMe && !session ? "__unauthorized__" : undefined;

  if (authorId === "__unauthorized__") {
    return jsonError("unauthorized", "Authentication required", 401);
  }

  const complaints = await complaintService.getFeed({
    limit,
    offset,
    companyId: company || undefined,
    topic_slug: topic || undefined,
    authorId: authorId ?? undefined,
  });
  const hasMore = complaints.length === limit;
  return jsonData(complaints, undefined, { page, limit, hasMore });
}

export async function POST(request: Request) {
  const rateLimited = await rateLimitOrNull(complaintCreateLimiter, getClientIp(request), "complaintCreate");
  if (rateLimited) return rateLimited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "Invalid JSON body", 400);
  }
  const session = await getApiSession(request);
  const result = await complaintService.createComplaint(body, session?.userId ?? null);
  if (!result.success) {
    return jsonError("create_failed", result.error, 400, result.details);
  }
  return jsonData(
    {
      id: String(result.complaint._id),
      flagged: Boolean(result.flagged),
    },
    { status: 201 }
  );
}
