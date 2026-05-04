# Páginas (App Router)

Caminhos em `src/app/`. Cada entrada: ficheiro `page.tsx` (e opcionalmente `layout.tsx`).

## Público / misto

| Rota | Função resumida |
|------|------------------|
| `/` | Home: feed, pesquisa rápida, actividade |
| `/login` | Login |
| `/register` | Registo |
| `/verificar-email` | Confirmação de email |
| `/redefinir-password` | Reset password |
| `/pesquisa` | Pesquisa avançada |
| `/reclamacao/[id]` | Detalhe denúncia |
| `/empresa/[slug]` | Empresa pública |
| `/t/[slug]` | Hub de tópico |
| `/topicos` | Lista de tópicos |
| `/mapa` | Mapa de calor |
| `/u/[handle]` | Perfil público |
| `/api-docs` | Swagger UI |
| `/verificar-empresa` | Fluxo verificação empresa |

## Autenticado (middleware privado)

| Rota | Função |
|------|--------|
| `/perfil` | Perfil próprio / edição |
| `/inbox` | Mensagens |
| `/notificacoes` | Centro de notificações |
| `/atividade` ou `/activities` | Actividade do utilizador (ver paths exactos no repo) |
| `/dashboard-empresa` | Painel empresa (layout dedicado) |
| `/analytics` | Estatísticas |

## Admin

| Rota | Função |
|------|--------|
| `/admin` | Consola admin (layout dedicado) |
| `/relatorio` | Relatório técnico (**admin-only** no middleware) |

## Know-how para implementar uma página nova

1. Decidir se é RSC-only ou precisa de `"use client"` em sub-componentes.
2. Dados: `getUser()` / `fetch` cache / chamada directa a serviços no servidor.
3. Se for privada: adicionar path ao middleware.
4. Reutilizar `PageHeader`, `SiteHeader`/`SiteFooter`, i18n `getMessage`.
5. SEO: `metadata` export em `page.tsx` ou `layout.tsx`.

## Actividade

| Rota | Notas |
|------|--------|
| `/atividade` | Página de actividade do utilizador |
| `/activities` | Variante / secção (pode ter `layout.tsx` próprio) |

Confirmar no `src/app` qual redirecciona ou duplica conteúdo; alinhar links no header.
