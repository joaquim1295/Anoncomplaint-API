# SmartComplaint Mobile (Android e iOS)

Frontend mobile em React Native (Expo) consumindo a API REST do projeto.

## Requisitos

- Node 20+
- **Android:** Android Studio + emulador (ou dispositivo com depuração USB)
- **iOS (macOS):** Xcode + Simulador, ou iPhone com o app Expo Go
- API rodando (`npm run dev` na raiz do projeto) ou deploy no Vercel

## Setup

1. Instale dependencias:

```bash
cd mobile
npm install
```

2. Configure a URL da API:

```bash
cp .env.example .env
```

Edite `EXPO_PUBLIC_API_BASE_URL`:

- Emulador Android local (API no mesmo PC): `http://10.0.2.2:3000/api/v1`
- Simulador iOS local: `http://127.0.0.1:3000/api/v1` ou `http://localhost:3000/api/v1`
- API no Vercel: `https://SEU-PROJETO.vercel.app/api/v1`
- Celular físico (Android ou iPhone) na mesma rede Wi-Fi: `http://SEU_IP_LOCAL:3000/api/v1` (ex.: `http://192.168.1.30:3000/api/v1`)

## Rodar

```bash
npm run start
```

No menu do Expo:

- Pressione `a` para abrir no emulador Android
- Pressione `i` para abrir no simulador iOS (só em macOS com Xcode)

Para build nativo na Apple (TestFlight/App Store), use [EAS Build](https://docs.expo.dev/build/introduction/) com o `bundleIdentifier` definido em `app.json` (`com.smartcomplaint.mobile`).

Se usar Expo Go com QR no celular, reinicie com cache limpo quando mudar deps:

```bash
npm run start -- --clear
```

## Fluxos implementados (alinhados à web)

**Convidado:** feed público, lista de tópicos, pesquisa de denúncias, ecrã de entrada/registo.

**Autenticado:** feed, tópicos, pesquisa, nova denúncia (título + texto + tags), conta com notificações, “as minhas denúncias”, links para páginas web (mapa, inbox, dashboard empresa, analytics, relatório admin, API docs), modais de detalhe de denúncia, feed por tópico e página pública de empresa.

- Login / registo com JWT (`POST /auth/login`, `POST /auth/register`)
- Feed e pesquisa (`GET /complaints`, `GET /complaints/search`)
- Criar denúncia (`POST /complaints`)
- Tópicos (`GET /topics`, feed por `topic`)
- Empresa pública (`GET /company/public/[slug]`)
- Notificações e atividades (`GET /notifications`, `GET /complaints?author=me`)
- Perfil (`GET /auth/me`)
- Logout (limpa token no dispositivo; tenta `POST /auth/logout`)

## Nota sobre autenticacao

O app envia `Authorization: Bearer <token>` nos endpoints protegidos.

## Importante sobre npm audit

Evite `npm audit fix --force` no app Expo sem revisar, pois pode trocar versoes de SDK e quebrar compatibilidade.
Use sempre:

```bash
npx expo install <pacote>
```

