import { z } from "zod";
import * as complaintService from "../../../../lib/complaintService";
import { getApiSession } from "../../../../lib/api/auth";
import { jsonData, jsonError, parsePagination } from "../../../../lib/api/http";

const createSchema = z.object({
  content: z.string(),
  tags: z.array(z.string()).optional(),
  ghost_mode: z.boolean().optional(),
  location_city: z.string().optional(),
  location_lat: z.number().optional(),
  location_lng: z.number().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { page, limit, offset } = parsePagination(url.searchParams);
  const complaints = await complaintService.getFeed({ limit, offset });
  const hasMore = complaints.length === limit;
  return jsonData(complaints, undefined, { page, limit, hasMore });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "Invalid JSON body", 400);
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation_error", "Invalid payload", 400, parsed.error.flatten());
  }
  const session = await getApiSession(request);
  const result = await complaintService.createComplaint(parsed.data, session?.userId ?? null);
  if (!result.success) {
    return jsonError("create_failed", result.error, 400);
  }
  return jsonData(
    {
      id: String(result.complaint._id),
      flagged: Boolean(result.flagged),
    },
    { status: 201 }
  );
}

