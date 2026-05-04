# Prompt agente — Fase 3c: Inbox, notificações e Pusher

## Contexto

Utilizadores trocam mensagens (**inbox**), recebem **notificações** persistidas e updates em tempo real via **Pusher**.

## Objectivo

1. **Inbox:** conversas + mensagens + marcar lidas — rotas em `api/v1/inbox/`, serviço `inbox-service.ts`, repositórios Conversation e DirectMessage.
2. **Notifications:** `GET /notifications`, `POST .../[id]/read`, serviço `notification-service.ts`.
3. **Pusher:** `POST /api/v1/pusher/auth` validando membership do utilizador no canal; triggers no servidor em eventos relevantes (`pusher-server.ts`); cliente em `pusher-client.ts` + canais em `pusher-channels.ts`.

## Entregáveis

- Variáveis de ambiente documentadas (`conhecimento/11-integracoes-terceiros.md`).
- Sem vazar `PUSHER_SECRET` ao cliente.

## Critérios de aceite

- Utilizador A envia mensagem → B recebe notificação/pusher conforme desenho actual.
- Listagens paginadas onde aplicável.

## Referências

- `conhecimento/08-features-por-dominio.md` (Inbox e Notificações)
- `conhecimento/11-integracoes-terceiros.md`
