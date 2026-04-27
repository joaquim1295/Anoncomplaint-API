import { requireApiAuth } from "../../../../lib/api/auth";
import { jsonData, parsePagination } from "../../../../lib/api/http";
import * as notificationRepository from "../../../../lib/repositories/notification-repository";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const { page, limit, offset } = parsePagination(url.searchParams);
  const docs = await notificationRepository.findByUserId(auth.session.userId, {
    limit,
    offset,
  });
  const hasMore = docs.length === limit;
  return jsonData(
    docs.map((n) => ({
      id: String(n._id),
      title: n.title,
      message: n.message,
      complaintId: n.complaintId ?? null,
      isRead: n.isRead,
      createdAt: n.createdAt,
    })),
    undefined,
    { page, limit, hasMore }
  );
}

