# Prompt agente — Fase 5e: Mapa, analytics, admin, relatório, perfil público, API docs

## Contexto

Funcionalidades “painel”: mapa de calor, analytics com gráficos, consola admin, relatório técnico só admin, perfil público `u/[handle]`, página Swagger.

## Objectivo

1. `/mapa` — Leaflet + heat; import dinâmico / no SSR para evitar erros de hidratação.
2. `/analytics` — gráficos Recharts + dados de serviços/API internos.
3. `/admin` — layout admin; listagens e acções (ban, moderação, pedidos empresa).
4. `/relatorio` — restrito a admin (middleware + UI).
5. `/u/[handle]` — perfil público condicionado a `public_profile_enabled`.
6. `/api-docs` — `SwaggerUI` + fetch da spec OpenAPI.
7. `/verificar-empresa` — fluxo de verificação de empresa.

## Entregáveis

- Guards de role no servidor (não confiar só no cliente).
- Tratamento de utilizador inexistente / perfil desactivado (404).

## Critérios de aceite

- Build passa sem importar Leaflet em RSC indevidamente.
- Admin não acessível a `role: user`.

## Referências

- `conhecimento/08-features-por-dominio.md`
- `conhecimento/10-componentes-chave.md`
