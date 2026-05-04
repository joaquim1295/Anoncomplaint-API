# Integrações de terceiros

## MongoDB

- URI e nome da base via env; conexão singleton em desenvolvimento para evitar leaks em HMR.

## Pusher Channels

- Servidor: trigger em eventos de negócio (notificações, mensagens).
- Cliente: subscrição com auth endpoint `POST /api/v1/pusher/auth`.
- Variáveis `NEXT_PUBLIC_*` apenas para key/cluster (nunca secret no cliente).

## Resend

- Envio transaccional (verificação email, alertas).
- Templates em `src/components/emails/`.

## Cloudinary

- Upload de imagens (avatars, anexos); fallback documentado no `.env.local.example` se URL mal formatada.

## Groq / AI

- Chave `GROQ_API_KEY`; uso em moderação ou resumos conforme `moderationService` / rotas AI.

## Upstash Redis

- Rate limiting distribuído; se ausente, código deve degradar sem bloquear desenvolvimento local.

## Swagger

- Página `/api-docs` embute `SwaggerUI`; spec gerada ou estática em `openapi` route.

## Sentry (opcional)

- Wizard mencionado no env example; não obrigatório para MVP local.
