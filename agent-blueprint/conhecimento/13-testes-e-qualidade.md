# Testes e qualidade

## Ferramentas

- **Jest** + **ts-jest** — `npm run test` na raiz (pode estar com `passWithNoTests`).
- **ESLint** (`eslint-config-next`) — `npm run lint`.
- **Prettier** — `npm run format` / `format:check`.

## O que testar primeiro (reconstrução)

1. `auth/login` + `auth/me` com cookie e com Bearer.
2. `GET /complaints` público vs autenticado + `author=me`.
3. `POST /complaints` validação (título, comprimento mínimo).
4. Middleware: acesso negado a `/inbox` sem sessão; admin a `/relatorio`.

## CI

Se existir `.github/workflows/ci.yml`, alinhar jobs com `lint`, `build`, `test` e variáveis mock para build sem secrets reais.
