# Prompt agente — Fase 6: App mobile Expo (paridade API)

## Contexto

Existe cliente **Expo** em `mobile/` que consome a mesma API `/api/v1` com Bearer token.

## Objectivo

Implementar ou alinhar `mobile/src/MainApp.tsx` (e `App.tsx`), `mobile/src/api/client.ts`, storage de token, tabs convidado vs autenticado, modais de detalhe, criação de denúncia, links WebBrowser para rotas web-only.

## Entregáveis

- `app.json` com `android.package` e `ios.bundleIdentifier`.
- `mobile/README.md` com URLs de API por emulador/simulador/dispositivo.
- `npm run typecheck` no mobile a passar.

## Critérios de aceite

- Login/registo guardam token e `GET /auth/me` funciona.
- Rotas públicas sem token; `author=me` e notificações só com token.

## Referências

- `conhecimento/12-mobile-expo.md`
- `conhecimento/07-catalogo-api-rest.md`
