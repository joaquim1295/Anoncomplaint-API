# Prompt agente — Fase 3d: Admin, upload, stats e OpenAPI

## Contexto

Administradores gerem utilizadores, denúncias e pedidos de verificação de empresa. Há **upload** de imagens, **stats** agregados e documentação **OpenAPI**.

## Objectivo

1. **Admin:** rotas sob `api/v1/admin/*` — users, ban, complaints, company-requests approve/reject, god-mode endpoints protegidos por env `ALLOW_GOD_MODE*`.
2. **Upload:** `POST /api/v1/upload/image` com Cloudinary (`conhecimento/11-integracoes-terceiros.md`).
3. **Stats / health:** rotas `stats` e `health`.
4. **OpenAPI:** `GET /api/v1/openapi` + eventual sincronização com `src/lib/api/openapi.ts`.

## Entregáveis

- Checagens de `role === admin` (ou equivalente) em cada handler admin.
- Tratamento seguro de ficheiros (tipo, tamanho).

## Critérios de aceite

- God mode desligado por defeito em produção.
- OpenAPI válida para consumo pelo Swagger UI da página `/api-docs`.

## Referências

- `conhecimento/07-catalogo-api-rest.md` (Admin, Upload)
- `conhecimento/11-integracoes-terceiros.md`
