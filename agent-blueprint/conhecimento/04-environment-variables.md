# Variáveis de ambiente

Copiar `.env.local.example` para `.env.local`. Lista orientativa (ver ficheiro real na raiz do repo para valores exactos):

## Obrigatórias / críticas

| Variável | Uso |
|----------|-----|
| `MONGODB_URI` | Ligação MongoDB |
| `MONGODB_DB` | Nome da base (fallback interno se omitido) |
| `JWT_SECRET` | Assinatura JWT — **mínimo 32 caracteres**; middleware falha se inválido |
| `PASSWORD_PEPPER` | Segundo factor estático no hash de passwords |
| `NEXT_PUBLIC_APP_URL` | URL pública (emails, metadata) |

## Realtime

| Variável | Uso |
|----------|-----|
| `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` | Servidor |
| `NEXT_PUBLIC_PUSHER_*` | Cliente browser |

## Opcionais / integrações

| Variável | Uso |
|----------|-----|
| `GROQ_API_KEY` | Funcionalidades AI/moderação |
| `RESEND_API_KEY` | Envio de emails |
| `CLOUDINARY_*` ou `CLOUDINARY_URL` | Upload de imagens |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |
| `CORS_ORIGINS` ou `CORS_ORIGIN` | Lista separada por vírgulas; `*` permitido |
| `JWT_COOKIE_NAME` | Nome do cookie (default no código) |
| `ALLOW_GOD_MODE`, `ALLOW_GOD_MODE_RESET` | Endpoints admin demo em produção |

## Mobile

- `mobile/.env` — tipicamente `EXPO_PUBLIC_API_BASE_URL` apontando para `https://.../api/v1` ou IP local.

## Segurança

- Nunca commitar `.env.local`.
- Em CI, usar secrets do fornecedor (GitHub Actions, Vercel).
