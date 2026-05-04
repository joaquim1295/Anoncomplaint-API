# Visão do produto

## Nome e propósito

**SmartComplaint** — plataforma de denúncias/reclamações públicas (estilo “queixa livre”) com:

- Feed e pesquisa de denúncias
- Empresas com páginas públicas, contagem de visualizações, comparação
- Tópicos (tags/hubs) com threads e seguimento
- Utilizadores com perfil público (`/u/[handle]`)
- Modo empresa: respostas a denúncias, gestão de estado
- Caixa de entrada (mensagens directas / conversas)
- Notificações em tempo real (Pusher) e persistidas em MongoDB
- Painel admin (utilizadores, pedidos de verificação de empresa, moderação)
- Relatório técnico (rota admin)
- Analytics com gráficos
- Mapa de calor (“rage map”) das denúncias
- API REST versionada (`/api/v1`) com documentação OpenAPI/Swagger na UI
- App mobile (Expo) Android/iOS consumindo a mesma API

## Personas

1. **Visitante** — lê feed, pesquisa, páginas de empresa e tópico.
2. **Utilizador autenticado** — cria denúncias, comenta em contexto de tópico, segue tópicos, inbox, notificações, perfil.
3. **Empresa verificada** — modo conta empresa, responde e actualiza estado das denúncias ligadas à empresa.
4. **Admin** — moderação, relatório, god-mode opcional (demo).

## Requisitos não-funcionais

- SSR/RSC onde faz sentido; dados sensíveis só no servidor.
- JWT com segredo forte; cookies HttpOnly para browser.
- CORS configurável para clientes móveis e origens web.
- Rate limiting por IP em rotas sensíveis quando Redis (Upstash) disponível.
