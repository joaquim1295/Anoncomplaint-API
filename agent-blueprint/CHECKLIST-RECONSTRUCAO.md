# Checklist de reconstrução (ordem sugerida)

Usar como roadmap quando vários agentes (ou várias sessões) reconstruírem o projecto do zero.

## Fase 0 — Fundação

- [ ] Next.js 15 App Router, TypeScript, Tailwind, ESLint/Prettier
- [ ] Variáveis de ambiente (ver `conhecimento/04-environment-variables.md`; ficheiro exemplo na raiz `.env.local.example`)
- [ ] `src/lib/db.ts` + ligação MongoDB com cache global
- [ ] `src/lib/api/http.ts`, `auth.ts`, padrão de erros JSON

## Fase 1 — Modelos e repositórios

- [ ] Mongoose: User, Complaint, Company, Topic, Notification, Conversation, DirectMessage, CompanyVerificationRequest, TopicComplaintComment
- [ ] Repositórios em `src/lib/repositories/*` espelhando queries usadas pelos serviços

## Fase 2 — Auth e sessão

- [ ] JWT (cookie HttpOnly + opcional Bearer para mobile), `jose`
- [ ] `POST /api/v1/auth/login`, `register`, `logout`, `me`, verificação email, forgot/reset password
- [ ] `src/middleware.ts`: paths privados, admin-only, CORS em `/api/v1`

## Fase 3 — Núcleo de negócio (API)

- [ ] Complaints: CRUD público filtrado, search, detalhe, status, rating, endorse, respostas empresa, subscriptions
- [ ] Topics: list, slug, follow, comentários em queixa no tópico
- [ ] Company: público por slug, search, compare, view; painel empresa (complaints, responses)
- [ ] Notifications + Pusher auth
- [ ] Inbox (conversas + mensagens)
- [ ] Upload imagens (Cloudinary)
- [ ] Stats, health, OpenAPI

## Fase 4 — Serviços transversais

- [ ] Notificações (email Resend onde aplicável)
- [ ] Rate limit Upstash (opcional em dev)
- [ ] Moderação / AI (Groq) se integrado nas rotas existentes
- [ ] Admin: users, complaints, company-requests, god-mode (só com flags env)

## Fase 5 — UI web

- [ ] `layout.tsx`, providers (tema, i18n, toaster)
- [ ] Componentes UI base (Radix + shadcn-style em `src/components/ui`)
- [ ] Páginas públicas: home, pesquisa, empresa, tópico, reclamação, mapa, login, registo
- [ ] Páginas autenticadas: perfil, inbox, notificações, dashboard empresa, analytics, admin, relatório
- [ ] i18n (messages JSON, provider)

## Fase 6 — Mobile

- [ ] Expo app em `mobile/` consumindo `/api/v1` com Bearer token
- [ ] Paridade de fluxos principais (ver `conhecimento/12-mobile-expo.md`)

## Fase 7 — Qualidade

- [ ] `npm run build`, `lint`, testes Jest onde existirem
- [ ] Documentar divergências no blueprint

Cada fase tem um prompt correspondente em `prompts-agente/` (prefixo numérico alinhado).
