# SmartComplaint Mobile (Android)

Frontend mobile em React Native (Expo) consumindo a API REST do projeto.

## Requisitos

- Node 20+
- Android Studio + emulador
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
- API no Vercel: `https://SEU-PROJETO.vercel.app/api/v1`
- Celular fisico no mesmo Wi-Fi: `http://SEU_IP_LOCAL:3000/api/v1` (ex.: `http://192.168.1.30:3000/api/v1`)

## Rodar

```bash
npm run start
```

No menu do Expo:

- Pressione `a` para abrir no Android emulator

Se usar Expo Go com QR no celular, reinicie com cache limpo quando mudar deps:

```bash
npm run start -- --clear
```

## Fluxos implementados

- Login (`POST /auth/login`)
- Registro (`POST /auth/register`)
- Feed (`GET /complaints`)
- Criar denuncia (`POST /complaints`)
- Notificacoes (`GET /notifications`)
- Perfil atual (`GET /auth/me`)
- Logout local (limpa token no app)

## Nota sobre autenticacao

O app envia `Authorization: Bearer <token>` nos endpoints protegidos.

## Importante sobre npm audit

Evite `npm audit fix --force` no app Expo sem revisar, pois pode trocar versoes de SDK e quebrar compatibilidade.
Use sempre:

```bash
npx expo install <pacote>
```

