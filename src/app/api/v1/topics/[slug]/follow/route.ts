import * as userRepository from "../../../../../../lib/repositories/userRepository";
import { getApiSession } from "../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../lib/api/http";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const session = await getApiSession(_request);
  if (!session) return jsonError("unauthorized", "Autenticação necessária.", 401);
  const { slug } = await context.params;
  const safe = String(slug ?? "").trim().toLowerCase();
  if (!safe || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(safe)) {
    return jsonError("validation_error", "Slug de tópico inválido", 400);
  }
  const { user, following } = await userRepository.toggleTopicFollow(session.userId, safe);
  if (!user) return jsonError("not_found", "Utilizador não encontrado", 404);
  return jsonData({ following, slug: safe, followedTopics: user.followedTopics ?? [] });
}
