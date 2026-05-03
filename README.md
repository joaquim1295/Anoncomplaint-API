# SmartComplaint

Plataforma web de **reclamações e denúncias** com feed público, respostas de empresas, estatísticas, salas de tópico (estilo Reddit), mensagens em tempo real e painéis para utilizador, empresa e administração.

Stack principal: **Next.js 15** (App Router), **React 19**, **TypeScript**, **MongoDB** (Mongoose), **Tailwind CSS**, **Radix UI**.

---

## Conteúdo

- [Funcionalidades](#funcionalidades)
- [Requisitos](#requisitos)
- [Arranque rápido](#arranque-rápido)
- [Scripts npm](#scripts-npm)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Internacionalização (i18n)](#internacionalização-i18n)
- [Autenticação e middleware](#autenticação-e-middleware)
- [API REST](#api-rest)
- [Rotas da interface](#rotas-da-interface)
- [Segurança e cabeçalhos HTTP](#segurança-e-cabeçalhos-http)
- [CI (GitHub Actions)](#ci-github-actions)
- [Resolução de problemas](#resolução-de-problemas)

---

## Funcionalidades

- **Feed e reclamações**: criação, pesquisa, página de detalhe com linha temporal, avaliações, subscrições, resumos IA (Groq), hashtags e agregação “temas em destaque” no início (distinto das **salas de tópico** em `/topicos` e `/t/[slug]`).
- **Empresas**: perfis públicos (`/empresa/[slug]`), verificação, dashboard de empresa (`/dashboard-empresa`), comparação e métricas.
- **Utilizadores**: registo, login (JWT em cookie), perfil, atividade (`/activities` e alias `/atividade`), inbox de conversas, notificações com **Pusher Channels**.
- **Mapa e relatórios**: mapa de calor (`/mapa`), relatório técnico (`/relatorio`, só **admin**).
- **Analytics**: página `/analytics` com rankings e indicadores (requer sessão conforme regras da app).
- **Admin**: moderação, pedidos de empresa, utilizadores, rotas “god mode” opcionais (ambiente controlado).
- **Documentação OpenAPI**: UI em `/api-docs` (especificação servida pela API).
- **Emails (Resend)**, **imagens (Cloudinary)**, **rate limiting (Upstash Redis)** quando configurados.
- **Três línguas**: português (predefinido), inglês e espanhol (`src/messages/*.json`).

---

## Requisitos

- **Node.js** 20+ (CI usa 22; 18+ pode funcionar, 20+ recomendado).
- **MongoDB** acessível (Atlas ou local). O nome da base é configurável (`MONGODB_DB` no `.env.local.example`).
- Contas opcionais mas recomendadas em produção: **Pusher**, **Resend**, **Cloudinary**, **Upstash Redis**, **Groq**.

---

## Arranque rápido

```bash
git clone <url-do-repositório>
cd "vibecoding 3"   # ou o nome da pasta do clone
npm install
```

1. Copie as variáveis de ambiente:

   ```bash
   copy .env.local.example .env.local
   ```

   (PowerShell: `Copy-Item .env.local.example .env.local`)

2. Edite **`.env.local`**: defina pelo menos **`MONGODB_URI`**, **`JWT_SECRET`** (mínimo **32 caracteres** — o middleware falha ao arrancar se for mais curto ou em falta), **`PASSWORD_PEPPER`**, **`NEXT_PUBLIC_APP_URL`**.

3. Garanta que o Next usa **`src/app`**: não deve existir uma pasta **`app/`** na raiz a competir com `src/app`. O código vive em **`src/`**.

4. Arranque o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Abra **http://localhost:3000**

---

## Scripts npm

| Comando            | Descrição                          |
|--------------------|------------------------------------|
| `npm run dev`      | Servidor de desenvolvimento Next   |
| `npm run build`    | Build de produção                  |
| `npm start`        | Servidor de produção (após build)  |
| `npm run lint`     | ESLint (Next)                      |
| `npm run test`     | Jest (`src`, ficheiros `*.test.ts`) |
| `npm run format`   | Prettier (escrita)                 |
| `npm run format:check` | Prettier (verificação)         |

---

## Variáveis de ambiente

A referência completa, comentada, está em **`.env.local.example`**. Resumo:

| Área            | Variáveis (exemplos) |
|-----------------|----------------------|
| MongoDB         | `MONGODB_URI`, `MONGODB_DB` |
| Auth / app      | `JWT_SECRET`, `PASSWORD_PEPPER`, `NEXT_PUBLIC_APP_URL` |
| Cookie JWT      | `JWT_COOKIE_NAME` (opcional; predefinido `anon_session`) |
| Pusher          | `PUSHER_*`, `NEXT_PUBLIC_PUSHER_*` |
| IA              | `GROQ_API_KEY` |
| Email           | `RESEND_API_KEY` |
| Imagens         | `CLOUDINARY_*` ou `CLOUDINARY_URL` |
| Rate limit      | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `TRUST_X_FORWARDED_FOR` |
| CORS API        | `CORS_ORIGINS` |
| Demo / admin    | `ALLOW_GOD_MODE`, `ALLOW_GOD_MODE_RESET` |
| Erros (opc.)    | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` |

**Não commite** `.env.local`.

---

## Estrutura do repositório

```
src/
  app/           # Rotas App Router (páginas, layouts, API route handlers)
  components/    # UI React
  lib/           # Serviços, repositórios Mongoose, i18n, utilitários
  messages/      # pt.json, en.json, es.json
middleware.ts    # JWT em rotas privadas, CORS em /api/v1, cabeçalhos login
```

Pastas na raiz **excluídas** do TypeScript / testes: `mobile/`, `AnonComplaint-Vibcoded/` (legado ou projeto paralelo).

**Alias:** `@/*` → `./src/*` (ver `tsconfig.json`).

---

## Internacionalização (i18n)

- Idiomas: **`pt`**, **`en`**, **`es`** (`src/lib/i18n/constants.ts`).
- Cookie **`NEXT_LOCALE`** define o locale no servidor (layout e mensagens).
- Ficheiros de cópia: `src/messages/pt.json`, `en.json`, `es.json`.

---

## Autenticação e middleware

- Sessão: **JWT** verificado no **`src/middleware.ts`** (biblioteca `jose`), cookie configurável (`JWT_COOKIE_NAME`).
- **Rotas privadas** (exigem login): entre outras, `/activities`, `/atividade`, `/perfil`, `/inbox`, `/notificacoes`, `/dashboard-empresa`, `/admin`, `/analytics`.
- **Só administrador**: `/relatorio` (e subcaminhos); outros roles são redirecionados para `/`.
- **`/api/v1/*`**: tratamento **CORS** e **OPTIONS**; não substitui autenticação por rota nas handlers (cada endpoint valida conforme necessário).
- **`/login`**: pode omitir navegação global via cabeçalho interno `x-ui-hide-nav`.

---

## API REST

- Prefixo: **`/api/v1/`**
- Saúde: **`GET /api/v1/health`**
- OpenAPI: **`GET /api/v1/openapi`** (consumida pela página **`/api-docs`**)

Áreas típicas: `auth`, `complaints`, `company`, `topics`, `users`, `inbox`, `notifications`, `pusher`, `upload`, `stats`, `admin`, etc.

---

## Rotas da interface

| Rota | Descrição |
|------|------------|
| `/` | Início — feed, estatísticas de empresas, hashtags em destaque, rage meter |
| `/login`, `/register` | Autenticação |
| `/pesquisa` | Pesquisa avançada |
| `/reclamacao/[id]` | Detalhe da reclamação |
| `/empresa/[slug]` | Perfil público da empresa |
| `/u/[handle]` | Perfil público de utilizador |
| `/topicos` | Lista e criação de salas de tópico (tableros) |
| `/t/[slug]` | Feed de uma sala de tópico |
| `/mapa` | Mapa |
| `/analytics` | Analytics (área autenticada) |
| `/relatorio` | Relatório técnico (**admin**) |
| `/activities`, `/atividade` | Atividade do utilizador |
| `/perfil` | Perfil |
| `/inbox` | Mensagens |
| `/notificacoes` | Notificações |
| `/dashboard-empresa` | Painel da empresa |
| `/admin` | Administração |
| `/verificar-email`, `/redefinir-password` | Fluxos de conta |
| `/verificar-empresa` | Verificação de empresa |
| `/api-docs` | Documentação interativa da API |

---

## Segurança e cabeçalhos HTTP

Em **`next.config.ts`**: **CSP**, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`; em produção, **HSTS**. `connect-src` inclui domínios **Pusher** para WebSockets.

---

## CI (GitHub Actions)

O workflow **`.github/workflows/ci.yml`** em `push`/`pull_request` (branches `main`/`master`) executa:

`npm ci` → `npm run lint` → `npm run test` → `npm run build`

O build define `JWT_SECRET` de exemplo para passar o middleware/compilação; para testes locais completos continue a precisar de MongoDB e `.env.local` adequado.

---

## Resolução de problemas

1. **Erro no arranque sobre `JWT_SECRET`**  
   Defina uma string com **≥ 32 caracteres** em `.env.local`.

2. **`app/` na raiz vs `src/app/`**  
   Remova ou renomeie `app/` na raiz para o Next usar apenas **`src/app`**.

3. **MongoDB**  
   Confirme `MONGODB_URI` e que a instância aceita ligações (IP allowlist no Atlas, etc.).

4. **Imagens Cloudinary**  
   Veja comentários em `.env.local.example` sobre `CLOUDINARY_URL` vs variáveis separadas e `remotePatterns` em `next.config.ts`.

---

## Licença e nome do pacote

O `package.json` declara o nome **`smart-complaint`** e `"private": true`. Ajuste metadados de licença no repositório se for distribuir o código.
