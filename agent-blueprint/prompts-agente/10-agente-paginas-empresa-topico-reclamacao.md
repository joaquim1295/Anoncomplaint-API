# Prompt agente — Fase 5c: Páginas empresa, tópico e detalhe de denúncia

## Contexto

Conteúdo público rico: página de empresa, hub de tópico, detalhe de uma denúncia, lista de tópicos.

## Objectivo

1. `/empresa/[slug]` — dados de `GET /company/public/[slug]`, lista de denúncias, incremento de views se aplicável.
2. `/t/[slug]` — tópico + feed filtrado + `TopicFollowButton` + comentários + dialog nova queixa.
3. `/topicos` — listagem de tópicos (`GET /topics`).
4. `/reclamacao/[id]` — detalhe com respostas oficiais, endorse, rating, acções do autor; dados de `GET /complaints/[id]`.

## Entregáveis

- `generateMetadata` ou `metadata` dinâmico com nome empresa / título denúncia.
- Componentes reutilizáveis de `conhecimento/10-componentes-chave.md`.

## Critérios de aceite

- Estados de loading e 404 distintos.
- Links internos consistentes (slugs URL-encoded).

## Referências

- `conhecimento/08-features-por-dominio.md`
- `conhecimento/10-componentes-chave.md`
