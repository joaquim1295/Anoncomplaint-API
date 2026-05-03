import { z } from "zod";
import * as topicService from "../../../../lib/topicService";
import { getApiSession } from "../../../../lib/api/auth";
import { jsonData, jsonDataCached, jsonError } from "../../../../lib/api/http";

const createBodySchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional().nullable(),
  company_id: z.string().min(24).max(24).regex(/^[a-f0-9]{24}$/i).optional().nullable(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = String(url.searchParams.get("q") ?? "").trim();
  const topics = q ? await topicService.searchTopics(q, 20) : await topicService.listTopicsForHub(50);
  return jsonDataCached(topics, { sMaxAge: 60, swr: 120 });
}

export async function POST(request: Request) {
  const session = await getApiSession(request);
  if (!session) return jsonError("unauthorized", "Autenticação necessária.", 401);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "JSON inválido", 400);
  }
  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation_error", "Dados inválidos", 400, parsed.error.flatten());
  }
  try {
    const topic = await topicService.createTopicFromTitle({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      company_id: parsed.data.company_id ?? null,
    });
    return jsonData(topic, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar tópico.";
    return jsonError("create_failed", msg, 400);
  }
}
