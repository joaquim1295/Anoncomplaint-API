# Prompt agente — Fase 0: Fundação Next.js

## Contexto

Estás a reconstruir a aplicação web **SmartComplaint**: plataforma de denúncias com Next.js 15 App Router, TypeScript, Tailwind, API REST sob `/api/v1`, MongoDB com Mongoose.

## Objectivo

Criar o esqueleto do monorepo web na raiz (ou pasta indicada): Next 15, TS strict, Tailwind, ESLint/Prettier, alias `@/` → `src/`, estrutura `src/app`, `src/lib`, `src/components`, `src/models`, `src/types`, `src/messages`.

## Entregáveis

- `package.json` com dependências alinhadas a `conhecimento/02-stack.md`.
- `src/app/layout.tsx` mínimo + `src/app/page.tsx` placeholder + `globals.css`.
- `src/lib/db.ts` com padrão de cache global Mongoose (igual ao descrito em `conhecimento/03-arquitetura-pastas.md`).
- `src/lib/api/http.ts` com helpers `jsonData` / `jsonError` e tipos de erro consistentes.
- `.env.local.example` com variáveis de `conhecimento/04-environment-variables.md`.
- `npm run build` e `npm run lint` a passar.

## Critérios de aceite

- Nenhum segredo hardcoded; documentação de env completa.
- Path `@/` funciona em imports.
- Build de produção sem erros.

## Referências no blueprint

- `conhecimento/02-stack.md`
- `conhecimento/03-arquitetura-pastas.md`
- `conhecimento/04-environment-variables.md`
