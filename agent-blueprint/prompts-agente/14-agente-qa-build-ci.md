# Prompt agente — Fase 7: QA, build produção e CI

## Contexto

O projecto deve compilar em produção e ter lint/format mínimos; CI opcional em GitHub Actions.

## Objectivo

1. Garantir `npm run build`, `npm run lint`, `npm run test` na raiz.
2. Garantir build/typecheck do `mobile/`.
3. Workflow CI: checkout, install, lint, build (env mock para secrets obrigatórios ao build).
4. Lista de smoke tests manuais documentada (auth, complaints, empresa, admin).

## Entregáveis

- Ficheiro `.github/workflows/ci.yml` ou actualização coerente com o stack.
- Secção no README raiz ou em `agent-blueprint` com comandos de verificação.

## Critérios de aceite

- Build não depende de `.env.local` com secrets reais (usar placeholders em CI).

## Referências

- `conhecimento/13-testes-e-qualidade.md`
