import * as topicService from "../../../../../lib/topicService";
import { jsonData, jsonError } from "../../../../../lib/api/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const safe = String(slug ?? "").trim().toLowerCase();
  if (!safe) return jsonError("bad_request", "Slug inválido", 400);
  const topic = await topicService.getTopicBySlug(safe);
  if (!topic) {
    return jsonData({
      slug: safe,
      title: topicService.titleFromSlug(safe),
      description: null,
      company_id: null,
      complaint_count: 0,
      exists: false,
    });
  }
  return jsonData({ ...topic, exists: true });
}
