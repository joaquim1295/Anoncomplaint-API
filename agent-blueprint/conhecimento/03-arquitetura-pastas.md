# Arquitectura de pastas e camadas

## Raiz do repositório

```
├── src/                    # Aplicação Next.js (web + API)
│   ├── app/                # App Router: layouts, pages, route handlers
│   │   ├── api/v1/         # REST API (route.ts por segmento)
│   │   └── <rota>/         # UI: page.tsx, layout.tsx, loading, error
│   ├── components/         # UI reutilizável (domínio + layout + ui/)
│   ├── lib/                # Lógica de servidor: serviços, repos, api helpers
│   ├── models/             # Schemas Mongoose
│   ├── types/              # Tipos TS partilhados (domínio)
│   ├── messages/           # i18n JSON
│   └── middleware.ts       # Edge: auth UI, CORS API, headers
├── mobile/                 # Expo (cliente móvel)
├── public/                 # Estáticos
├── agent-blueprint/        # Este blueprint (fora do source)
└── package.json
```

## Padrão em camadas

1. **Route Handler** (`route.ts`) — valida input, chama serviço, devolve `jsonData` / `jsonError`.
2. **Service** (`src/lib/*Service.ts`) — regras de negócio, orquestra repositórios.
3. **Repository** (`src/lib/repositories/*.ts`) — queries Mongoose, agregações, índices implícitos.
4. **Model** (`src/models/*.ts`) — schema + tipos de documento.

## Convenções HTTP internas

- Helpers em `src/lib/api/http.ts`: respostas JSON consistentes.
- Auth de request em `src/lib/api/auth.ts`: sessão a partir de cookie e/ou header `Authorization: Bearer`.

## Páginas vs API

- Conteúdo público SEO-friendly: **RSC** em `page.tsx` com `fetch` interno ou chamadas a serviços no servidor.
- Mutações e dados do cliente: **Route Handlers** + `fetch` do browser ou mobile.

## Componentes

- **`src/components/ui/`** — primitivos (Button, Card, Input, Dialog…).
- **`src/components/layout/`** — SiteHeader, SiteFooter, MobileNav, PageHeader.
- **`src/components/complaints/`** — feed, cartões, mapa, formulários de resposta.
- **`src/components/dashboard/`** — painel empresa.
- **`src/components/topics/`** — listas, follow, comentários, dialog nova queixa no tópico.

## Ficheiros importantes de referência

- `src/lib/getUser.ts` — utilizador actual na RSC/route.
- `src/lib/validations.ts` — schemas zod partilhados quando existirem.
- `src/lib/db.ts` — conexão singleton Mongoose.
