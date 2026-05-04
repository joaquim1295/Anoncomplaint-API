# Prompt agente — Fase 2: Auth JWT, cookies e middleware

## Contexto

Autenticação com **JWT** (`jose`), cookie **HttpOnly** para browser e suporte a **Bearer** para mobile. Rotas UI privadas e admin listadas no middleware.

## Objectivo

1. Implementar `src/lib/authService.ts` (registo, login, logout, me, verify email, forgot/reset password) com bcrypt + pepper.
2. Implementar `src/lib/api/auth.ts` para extrair utilizador da `Request` (cookie + Authorization).
3. Route handlers: `POST /api/v1/auth/login`, `register`, `logout`, `GET me`, e rotas de verificação/recuperação conforme catálogo.
4. Respostas de login/register devem incluir **`token`** JWT para clientes não-browser, mantendo `Set-Cookie` para web.
5. `src/middleware.ts`: validar JWT; proteger `PRIVATE_PATHS`; `ADMIN_ONLY_PATHS` para `/relatorio`; CORS em `/api/v1` com OPTIONS 204.

## Entregáveis

- Middleware testável localmente com `JWT_SECRET` (≥32 chars).
- Documentar no código os nomes de cookies e claims (issuer/audience se usados).

## Critérios de aceite

- Sem sessão: `/inbox` redirecciona ou bloqueia conforme política actual do projecto.
- Com sessão admin: acesso a `/relatorio`; user normal: negado.
- CORS não quebra preflight do Expo web/mobile.

## Referências

- `conhecimento/06-auth-sessao.md`
- `conhecimento/07-catalogo-api-rest.md` (secção Auth)
