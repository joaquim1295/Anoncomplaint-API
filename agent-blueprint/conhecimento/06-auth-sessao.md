# Autenticação e sessão

## Mecanismos

1. **JWT** assinado com `JWT_SECRET` (biblioteca `jose`).
2. **Browser:** cookie HttpOnly (nome configurável, ex. via `JWT_COOKIE_NAME`).
3. **Clientes API (mobile, integrações):** header `Authorization: Bearer <token>`.
4. **Login / Register:** respostas JSON devem incluir `token` quando o produto suporta clientes não-browser, mantendo cookie para web.

## Middleware (`src/middleware.ts`)

- Verifica JWT para rotas **privadas** da UI (lista `PRIVATE_PATHS`: perfil, inbox, dashboard empresa, admin, analytics, etc.).
- Rotas **só admin** (ex. `/relatorio`) além de autenticados exigem role admin (lógica no middleware + verificação de claims).
- Prefixo `/api/v1`: aplica **CORS** (preflight OPTIONS, headers); não substitui auth por rota — cada handler valida sessão.
- Header custom `x-ui-hide-nav` para `/login` (layout compacto).

## Servidor

- `src/lib/api/auth.ts` — extrair utilizador da `Request` (cookie + Bearer).
- `src/lib/getUser.ts` — contexto RSC.
- `src/lib/authService.ts` — login, registo, verify email, reset password.

## Roles

Ver `src/types/user.ts` (`UserRole`: user, admin, etc.). Painéis admin e relatório dependem disto.

## Logout

- `POST /api/v1/auth/logout` — invalidar cookie no browser; mobile apaga token local.

## Know-how para agentes

- Nunca expor `JWT_SECRET` ao cliente.
- Ao criar nova página privada, **adicionar o path** em `PRIVATE_PATHS` no middleware.
- Testar sempre com e sem cookie; testar mobile com só Bearer.
