import * as topicRepository from "./repositories/topicRepository";
import type { TopicDocument } from "../models/Topic";
import type { TopicDisplay } from "../types/topic";

export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function toTopicDisplay(doc: TopicDocument): TopicDisplay {
  return {
    id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    description: doc.description ?? null,
    company_id: doc.company_id ?? null,
    complaint_count: doc.complaint_count ?? 0,
    created_at: doc.created_at,
  };
}

export async function ensureTopicExists(slug: string, titleHint?: string): Promise<TopicDocument> {
  const normalized = slug.toLowerCase().trim();
  let doc = await topicRepository.findBySlug(normalized);
  if (doc) return doc;
  const title = (titleHint ?? "").trim() || titleFromSlug(normalized);
  try {
    return await topicRepository.create({
      slug: normalized,
      title,
      description: null,
      company_id: null,
    });
  } catch {
    doc = await topicRepository.findBySlug(normalized);
    if (doc) return doc;
    throw new Error("Não foi possível criar o tópico.");
  }
}

export async function getTopicBySlug(slug: string): Promise<TopicDisplay | null> {
  const doc = await topicRepository.findBySlug(slug);
  return doc ? toTopicDisplay(doc) : null;
}

export async function listTopicsForHub(limit = 50): Promise<TopicDisplay[]> {
  const docs = await topicRepository.listRecent(limit);
  return docs.map(toTopicDisplay);
}

export async function searchTopics(q: string, limit = 15): Promise<TopicDisplay[]> {
  const docs = await topicRepository.searchBySlugPrefix(q, limit);
  return docs.map(toTopicDisplay);
}

function slugifyTitle(title: string): string {
  return String(title ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function createTopicFromTitle(input: {
  title: string;
  description?: string | null;
  company_id?: string | null;
}): Promise<TopicDisplay> {
  const base = slugifyTitle(input.title);
  if (!base) throw new Error("Título inválido para gerar o slug.");
  let slug = base;
  for (let i = 0; i < 20; i++) {
    const existing = await topicRepository.findBySlug(slug);
    if (!existing) {
      const doc = await topicRepository.create({
        slug,
        title: input.title.trim().slice(0, 120),
        description: input.description ?? null,
        company_id: input.company_id ?? null,
      });
      return toTopicDisplay(doc);
    }
    slug = `${base}-${i + 2}`;
  }
  throw new Error("Não foi possível gerar um slug único.");
}
