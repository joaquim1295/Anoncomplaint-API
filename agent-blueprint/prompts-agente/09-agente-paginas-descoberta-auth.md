# Prompt agente — Fase 5b: Páginas descoberta e autenticação

## Contexto

Fluxos públicos e entrada de utilizadores: home, pesquisa, login, registo, verificação email, reset password.

## Objectivo

Implementar `page.tsx` (e client components necessários) para:

- `/` — home com feed, `HomeSearchBar` ou equivalente, actividade em directo se aplicável.
- `/pesquisa` — pesquisa de denúncias consumindo `GET /api/v1/complaints/search`.
- `/login` — `LoginForm` + chamada API.
- `/register` — `RegisterForm`.
- `/verificar-email` — processar token da query e chamar API.
- `/redefinir-password` — pedido + confirmação conforme rotas `forgot-password` / `reset-password`.

## Entregáveis

- Redireccionamentos pós-login para home ou `next` query param seguro.
- Mensagens de erro acessíveis (toast ou texto).

## Critérios de aceite

- Fluxo completo registo → email (mock em dev) → login.
- SEO: títulos por página.

## Referências

- `conhecimento/09-paginas-app-router.md`
- `conhecimento/10-componentes-chave.md`
