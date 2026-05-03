import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { jsonError } from "./api/http";

export function getClientIp(request: Request): string {
  const trusted = process.env.TRUST_X_FORWARDED_FOR === "1";
  if (trusted) {
    const fwd = request.headers.get("x-forwarded-for");
    if (fwd) {
      const first = fwd.split(",")[0]?.trim();
      if (first) return first;
    }
  }
  const real = request.headers.get("x-real-ip");
  if (real?.trim()) return real.trim();
  return "local";
}

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redis = null;
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
}

function makeLimiter(
  prefix: string,
  requests: number,
  window: "1 s" | "10 s" | "1 m" | "5 m" | "15 m" | "1 h" | "1 d"
) {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `smartcomplaint:${prefix}`,
    analytics: false,
  });
}

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function memoryAllow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const row = memoryBuckets.get(key);
  if (!row || now >= row.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (row.count >= max) return false;
  row.count += 1;
  return true;
}

/** Criação de denúncias: por IP. */
export const complaintCreateLimiter = makeLimiter("complaint-create", 20, "1 h");

/** Upload de imagens: por IP. */
export const imageUploadLimiter = makeLimiter("image-upload", 80, "1 h");

/** Contexto IA por denúncia: por IP. */
export const aiContextLimiter = makeLimiter("ai-context", 30, "1 m");

export const authLoginLimiter = makeLimiter("auth-login", 30, "15 m");
export const authRegisterLimiter = makeLimiter("auth-register", 10, "1 h");
export const authPasswordLimiter = makeLimiter("auth-password", 15, "1 h");
export const accountDeleteLimiter = makeLimiter("account-delete", 5, "1 h");
export const roleChangeLimiter = makeLimiter("role-change", 10, "1 h");
export const inboxLimiter = makeLimiter("inbox", 120, "1 m");
/** Incremento de visualizações públicas por empresa (slug). */
export const companyPublicViewLimiter = makeLimiter("company-public-view", 60, "1 m");
export const statsLimiter = makeLimiter("stats", 60, "1 m");
export const aiSummaryLimiter = makeLimiter("ai-summary", 20, "1 h");
export const forgotPasswordLimiter = makeLimiter("forgot-password", 8, "1 h");

type MemorySpec = { prefix: string; max: number; windowMs: number };

const memorySpecs: Record<string, MemorySpec> = {
  complaintCreate: { prefix: "m:complaint-create", max: 20, windowMs: 3_600_000 },
  imageUpload: { prefix: "m:image-upload", max: 80, windowMs: 3_600_000 },
  aiContext: { prefix: "m:ai-context", max: 30, windowMs: 60_000 },
  authLogin: { prefix: "m:auth-login", max: 30, windowMs: 900_000 },
  authRegister: { prefix: "m:auth-register", max: 10, windowMs: 3_600_000 },
  authPassword: { prefix: "m:auth-password", max: 15, windowMs: 3_600_000 },
  accountDelete: { prefix: "m:account-delete", max: 5, windowMs: 3_600_000 },
  roleChange: { prefix: "m:role-change", max: 10, windowMs: 3_600_000 },
  inbox: { prefix: "m:inbox", max: 120, windowMs: 60_000 },
  companyPublicView: { prefix: "m:company-public-view", max: 60, windowMs: 60_000 },
  stats: { prefix: "m:stats", max: 60, windowMs: 60_000 },
  aiSummary: { prefix: "m:ai-summary", max: 20, windowMs: 3_600_000 },
  forgotPassword: { prefix: "m:forgot-password", max: 8, windowMs: 3_600_000 },
};

/**
 * Limite de pedidos: Redis (Upstash) se configurado; caso contrário memória em processo (fail-soft em serverless).
 * Sem Redis em produção multi-instância, configure Upstash para limites consistentes.
 */
export async function rateLimitOrNull(
  limiter: Ratelimit | null,
  key: string,
  memoryKey: keyof typeof memorySpecs
): Promise<Response | null> {
  if (limiter) {
    const { success } = await limiter.limit(key);
    if (!success) {
      return jsonError(
        "rate_limit",
        "Demasiados pedidos a partir deste endereço. Aguarde e tente novamente.",
        429
      );
    }
    return null;
  }
  const spec = memorySpecs[memoryKey];
  const memKey = `${spec.prefix}:${key}`;
  if (!memoryAllow(memKey, spec.max, spec.windowMs)) {
    return jsonError(
      "rate_limit",
      "Demasiados pedidos a partir deste endereço. Aguarde e tente novamente.",
      429
    );
  }
  return null;
}
