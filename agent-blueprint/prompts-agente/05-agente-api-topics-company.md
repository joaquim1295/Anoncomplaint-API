# Prompt agente — Fase 3b: API tópicos e empresas

## Contexto

**Tópicos** agregam denúncias por slug; **empresas** têm páginas públicas e fluxo de verificação e painel dono.

## Objectivo

1. **Topics:** `GET /topics`, `GET /topics/[slug]`, `POST .../follow`, comentários em `topics/[slug]/complaints/[complaintId]/comments` — serviços `topicService`, `topicComplaintCommentService`, repositórios.
2. **Company público:** `GET /company/public/[slug]`, `view`, `search`, `compare`.
3. **Company autenticado:** CRUD companies, listagem de denúncias da empresa, `response` e `status` em denúncias atribuídas; `verification/confirm`.

## Entregáveis

- Rotas route.ts espelhando o catálogo.
- Autorização: só dono da empresa ou admin nas mutações sensíveis.

## Critérios de aceite

- Slug empresa único; payloads públicos sem dados internos (emails de donos, etc.).
- Seguir `conhecimento/08-features-por-dominio.md` (Tópicos e Empresas).

## Referências

- `conhecimento/07-catalogo-api-rest.md`
- `conhecimento/08-features-por-dominio.md`
