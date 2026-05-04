# Prompt agente — Fase 3a: API de denúncias (núcleo)

## Contexto

O produto gira em torno de **denúncias** com moderação, empresa, tópico, respostas oficiais, endorsements, ratings e pesquisa.

## Objectivo

Implementar `src/lib/complaintService.ts` + `complaintRepository.ts` e todas as rotas sob `src/app/api/v1/complaints/` conforme `conhecimento/07-catalogo-api-rest.md`:

- Listagem GET com paginação e filtros (`topic`, `company`, `author=me` autenticado).
- POST criação com validação (título, comprimento mínimo do texto, tags).
- GET detalhe por id; PATCH/DELETE conforme regras de autor/moderação.
- `GET /complaints/search`.
- Sub-rotas: response, status, rating, endorse, replies a respostas oficiais.
- `subscriptions/[complaintId]/toggle` se integrado no feed de notificações.

## Entregáveis

- Validação Zod onde o projecto padronizar.
- Respostas via `jsonData`/`jsonError`.
- Feed público não expõe denúncias em `pending_review` (excepto regra “minhas” para autor).

## Critérios de aceite

- Testes manuais ou Jest para pelo menos uma criação + listagem + search.
- Paridade com tipos em `src/types/complaint.ts`.

## Referências

- `conhecimento/08-features-por-dominio.md` (secção Denúncias)
- `conhecimento/07-catalogo-api-rest.md`
