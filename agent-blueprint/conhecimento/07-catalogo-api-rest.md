# Catálogo API REST (`/api/v1`)

Prefixo base: **`/api/v1`**. Métodos e corpos exactos: ver cada `route.ts`.

## Health e meta

| Método | Caminho | Notas |
|--------|---------|--------|
| GET | `/health` | Liveness |
| GET | `/stats` | Estatísticas agregadas (público restrito conforme implementação) |
| GET | `/openapi` | Esquema OpenAPI |

## Auth

| Método | Caminho |
|--------|---------|
| POST | `/auth/login` |
| POST | `/auth/register` |
| POST | `/auth/logout` |
| GET | `/auth/me` |
| POST | `/auth/verify-email` |
| POST | `/auth/forgot-password` |
| POST | `/auth/reset-password` |

## Conta

| Método | Caminho |
|--------|---------|
| GET/PATCH | `/users/me/account` |
| PATCH | `/users/me/username` |
| PATCH | `/users/me/password` |
| PATCH | `/users/me/role` (admin) |
| POST | `/account/mode` | Modo pessoal vs empresa |

## Denúncias

| Método | Caminho |
|--------|---------|
| GET | `/complaints` | Query: paginação, `topic`, `company`, `author=me`, etc. |
| POST | `/complaints` |
| GET | `/complaints/search` |
| GET | `/complaints/[id]` |
| PATCH/DELETE | `/complaints/[id]` (conforme política) |
| POST | `/complaints/[id]/response` |
| POST | `/complaints/[id]/status` |
| POST | `/complaints/[id]/rating` |
| POST | `/complaints/[id]/endorse` |
| POST | `/complaints/[id]/responses/[responseId]/replies` |
| GET | `/complaints/[id]/ai-summary` |
| GET | `/complaints/[id]/ai-context` (path pode ser `/ai/context/[complaintId]`) |
| POST | `/subscriptions/[complaintId]/toggle` |

## Tópicos

| Método | Caminho |
|--------|---------|
| GET | `/topics` |
| GET | `/topics/[slug]` |
| POST | `/topics/[slug]/follow` |
| GET/POST | `/topics/[slug]/complaints/[complaintId]/comments` |

## Empresa (público)

| Método | Caminho |
|--------|---------|
| GET | `/company/public/[slug]` |
| POST | `/company/public/[slug]/view` |
| GET | `/company/public/search` |
| GET | `/company/public/[slug]/compare` |

## Empresa (autenticado / dono)

| Método | Caminho |
|--------|---------|
| GET/POST | `/company/companies` |
| GET/PATCH | `/company/companies/[id]` |
| GET | `/company/complaints` |
| POST | `/company/complaints/[id]/response` |
| POST | `/company/complaints/[id]/status` |
| POST | `/company/verification/confirm` |

## Inbox

| Método | Caminho |
|--------|---------|
| GET | `/inbox/conversations` |
| GET/POST | `/inbox/conversations/[id]/messages` |
| POST | `/inbox/conversations/[id]/read` |

## Notificações

| Método | Caminho |
|--------|---------|
| GET | `/notifications` |
| POST | `/notifications/[id]/read` |

## Realtime

| Método | Caminho |
|--------|---------|
| POST | `/pusher/auth` | Autorização canal privado |

## Upload

| Método | Caminho |
|--------|---------|
| POST | `/upload/image` |

## Admin

| Método | Caminho |
|--------|---------|
| GET | `/admin/users` |
| POST | `/admin/users/[id]/ban` |
| GET | `/admin/complaints` |
| … | `/admin/complaints/[id]` |
| GET | `/admin/company-requests` |
| POST | `/admin/company-requests/[id]/approve` |
| POST | `/admin/company-requests/[id]/reject` |
| POST | `/admin/god-mode/force-approve` |
| POST | `/admin/god-mode/simulate-response` |
| POST | `/admin/god-mode/reset-demo` |

*(Flags `ALLOW_GOD_MODE` / `ALLOW_GOD_MODE_RESET` controlam perigos em produção.)*

---

Ao implementar uma rota nova, actualizar este ficheiro e `src/lib/api/openapi.ts` se o projecto mantiver OpenAPI sincronizado.
