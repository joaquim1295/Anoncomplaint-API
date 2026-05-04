# Prompt agente — Fase 5d: Perfil, inbox, notificações, dashboard empresa, actividade

## Contexto

Rotas **privadas** (middleware): utilizador gere perfil, mensagens, alertas, painel empresa e histórico de actividade.

## Objectivo

Implementar:

- `/perfil` — edição bio, avatar (upload), localização, website, toggle perfil público, `AccountModeSwitcher`.
- `/inbox` — lista conversas + thread de mensagens + marcar lidas.
- `/notificacoes` — lista + link para denúncia relacionada.
- `/dashboard-empresa` — layout dedicado; `CompanyManagementPanel`, `CompanyComplaintManager`.
- `/atividade` e/ou `/activities` — alinhar com API de actividades do utilizador.

## Entregáveis

- Gating: redirect para `/login` se não autenticado (ou comportamento igual ao middleware actual).
- Integração Pusher no cliente onde a UI em tempo real for necessária.

## Critérios de aceite

- Modo empresa só para utilizadores com empresa / permissões correctas.
- Não expor dados de outras empresas.

## Referências

- `conhecimento/06-auth-sessao.md`
- `conhecimento/09-paginas-app-router.md`
