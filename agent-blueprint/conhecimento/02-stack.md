# Stack tecnológica

## Runtime e framework

| Camada | Tecnologia | Notas |
|--------|------------|--------|
| Web | **Next.js 15** (App Router) | `src/app/`, RSC, Route Handlers |
| Linguagem | **TypeScript 5** | Strict recomendado |
| UI | **React 19**, **Tailwind CSS 3** | Utility-first |
| Componentes | **Radix UI** primitives | Dialog, Dropdown, Select, Tabs, Toast, Label |
| Formulários | **react-hook-form** + **zod** + **@hookform/resolvers** | Validação alinhada ao servidor |
| Temas | **next-themes** | Dark/light |
| Icons | **lucide-react** | |
| Gráficos | **recharts** | Analytics |
| Mapas | **leaflet**, **react-leaflet**, **leaflet.heat** | Mapa no cliente (dynamic/no SSR onde necessário) |
| Email | **Resend** + **@react-email/components** | Templates React |
| Auth tokens | **jose** | JWT verify/sign |
| Password | **bcryptjs** + pepper env | |
| DB | **MongoDB** via **mongoose 8** | Modelos em `src/models/` |
| Realtime | **pusher** (server), **pusher-js** (client) | Canais privados com auth endpoint |
| Rate limit | **@upstash/ratelimit** + **@upstash/redis** | Opcional se env ausente |
| Imagens | **cloudinary** SDK | Upload assinado / URLs |
| API docs UI | **swagger-ui-react** | Página `/api-docs` |
| Toasts | **sonner** | |
| i18n | Ficheiros JSON em `src/messages/` + providers custom | pt, en, es (ajustar conforme repo) |
| Mobile | **Expo 54**, **React Native** | Pasta `mobile/` |

## Scripts úteis (raiz)

- `npm run dev` — desenvolvimento
- `npm run build` / `npm run start` — produção
- `npm run lint`, `npm run format`

## Path aliases

O projecto usa `@/` para `src/` (configurado em `tsconfig.json`).
