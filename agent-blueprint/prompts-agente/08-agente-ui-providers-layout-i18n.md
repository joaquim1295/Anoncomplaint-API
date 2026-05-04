# Prompt agente — Fase 5a: UI base, providers, i18n e layout global

## Contexto

A shell da app usa **RootLayout** com header, footer, sidebar onde aplicável, **next-themes**, **i18n** com mensagens JSON, **Sonner** toasts, navegação mobile.

## Objectivo

1. Implementar `src/app/layout.tsx` com metadata SEO base, `AppProviders`, `AppToaster`, `SiteHeader`, `SiteFooter`, `MobileNav`, `SideBar` conforme composição actual do repo.
2. `src/lib/i18n/*` — carregar locale, dicionário `getMessage`, `getI18n` para RSC.
3. `src/messages/*.json` — chaves mínimas para navegação e home.
4. Primitivos UI em `src/components/ui/` (Button, Card, Input, Dialog, …).

## Entregáveis

- Tema claro/escuro funcional.
- Troca de idioma persistente (cookie ou localStorage conforme implementação).
- Header esconde navegação em `/login` via header `x-ui-hide-nav` (middleware).

## Critérios de aceite

- Sem hydration mismatch nos componentes de tema/idioma.
- `npm run build` sem erros RSC.

## Referências

- `conhecimento/10-componentes-chave.md`
- `conhecimento/09-paginas-app-router.md`
