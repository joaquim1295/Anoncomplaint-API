# Componentes chave

## Layout e navegação

| Componente | Ficheiro | Papel |
|--------------|----------|--------|
| `SiteHeader` | `layout/SiteHeader.tsx` | Topo desktop, links principais |
| `SiteFooter` | `layout/SiteFooter.tsx` | Rodapé |
| `MobileNav` | `layout/MobileNav.tsx` | Navegação inferior mobile |
| `PageHeader` | `layout/PageHeader.tsx` | Título secção |
| `SideBar` | `SideBar.tsx` | Barra lateral (home) |
| `UserNav` | `UserNav.tsx` | Menu utilizador autenticado |
| `LanguageSwitcher` | `layout/LanguageSwitcher.tsx` | i18n |

## Formulários auth

| Componente | Papel |
|--------------|--------|
| `LoginForm` | Email/username + password |
| `RegisterForm` | Registo + validação |

## Denúncias

| Componente | Papel |
|--------------|--------|
| `ComplaintForm` | Criar denúncia (web) |
| `ComplaintItem` | Cartão / linha de denúncia |
| `ComplaintFeed` | Lista paginada |
| `PublicComplaintCard` | Variante pública |
| `ComplaintCompanyResponseForm` | Empresa responde |
| `EditOwnComplaintButton` / `DeleteComplaintButton` | Acções autor |
| `RageMap` / `RageMapNoSSR` | Mapa |
| `AiContextModal` | Contexto AI |

## Home / discovery

| Componente | Papel |
|--------------|--------|
| `HomeSearchBar` | Pesquisa na home |
| `SearchBar` | Pesquisa genérica |
| `LiveActivityFeed` | Actividade recente |
| `QuickComplaintLauncher` | Atalho criar queixa |

## Tópicos

| Componente | Papel |
|--------------|--------|
| `TopicComplaintRow` | Linha no hub |
| `TopicFollowButton` | Seguir tópico |
| `TopicComplaintCommentsAccordion` | Comentários |
| `TopicNewComplaintDialog` | Nova queixa no tópico |

## Dashboard empresa

| Componente | Papel |
|--------------|--------|
| `CompanyManagementPanel` | Gestão dados empresa |
| `CompanyComplaintManager` | Lista e acções denúncias |
| `AdminGodModeBar` | Barra demo admin (condicional) |

## Conta

| Componente | Papel |
|--------------|--------|
| `AccountModeSwitcher` | Pessoal vs empresa |

## UI primitivos (`components/ui/`)

Button, Card, Input, Textarea, Label, Dialog, Skeleton — padrão shadcn-like com CVA e Radix.

## Providers

| Ficheiro | Papel |
|----------|--------|
| `AppProviders.tsx` | Theme + i18n + contextos |
| `AppToaster.tsx` | Sonner |
| `I18nProvider.tsx` | Locale cliente |

## Know-how

- Componentes que usam `window`, Leaflet ou Pusher: marcar `"use client"` e dynamic import se necessário.
- Preferir composição: página fina, lógica em hooks locais ou server actions (se adoptadas).
