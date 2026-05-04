# Features por domínio (know-how)

## Denúncias (complaints)

- Criação com título, conteúdo mínimo, tags, opcional empresa e localização, modo fantasma.
- Estados: moderados (`pending_review` vs públicos) — feed público filtra; feed “minhas” pode incluir pendentes.
- Interacções: endorse, rating final, edição pelo autor (transparência com `edited_at`).
- Resposta oficial da empresa: thread com replies (incl. AI summary opcional).
- Subscrição a updates de uma denúncia.

**Implementação:** `complaintService.ts`, `complaintRepository.ts`, rotas em `api/v1/complaints/`.

## Tópicos

- Lista global e página por slug (`/t/[slug]`).
- Seguir tópico (`followedTopics` no User).
- Comentários por par (topic + complaint): `topicComplaintCommentService`.

**Implementação:** `topicService.ts`, `topicRepository.ts`, rotas `topics/`.

## Empresas

- Página pública `/empresa/[slug]`: nome, logo, descrição, views, lista de denúncias ligadas.
- Compare e search públicos.
- Verificação: pedidos admin, estado no `CompanyVerificationRequest`.
- Modo conta: `account/mode` alterna contexto UI empresa vs pessoal.

**Implementação:** `companyService.ts`, `companyRepository.ts`, `services/company-verification-service.ts`.

## Inbox

- Conversas entre utilizadores; mensagens com leitura.
- UI: `/inbox`; botão no perfil para iniciar conversa.

**Implementação:** `inbox-service.ts`, repositórios `conversation-repository`, `direct-message-repository`.

## Notificações e realtime

- Persistência em MongoDB; marcar como lidas.
- Pusher: notificar cliente em eventos (nova mensagem, update de denúncia, etc.) — canais privados com `/pusher/auth`.

**Implementação:** `notification-service.ts`, `pusher-server.ts`, `pusher-client.ts`, componentes que subscrevem.

## Perfil público

- `/u/[handle]` quando `public_profile_enabled` e username definido.
- Campos: bio, localização, website, avatar.

## Mapa

- Agregação geográfica das denúncias com coordenadas; heatmap Leaflet.
- Componentes `RageMap` / `RageMapNoSSR` para evitar SSR incompatível.

## Analytics

- Dashboard com gráficos Recharts; dados via serviços/API internos.

## Admin

- Listagens users/denúncias/pedidos empresa; acções ban, approve/reject.
- God mode apenas com env e para demos.

## AI (se activo)

- Contexto por denúncia, resumo — `ai-context-service`, rotas sob `complaints/[id]/…`.

## Internacionalização

- Dicionário por locale; `getI18n` no servidor; provider no cliente para troca de idioma.

## Rate limiting

- `rate-limit.ts` + Upstash; degradar graciosamente sem Redis.
