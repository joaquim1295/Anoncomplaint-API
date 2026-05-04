# Mobile (Expo)

## Localização

Pasta **`mobile/`** — projecto separado com próprio `package.json`.

## Stack

- Expo SDK ~54, React Native, TypeScript.
- `@react-native-async-storage/async-storage` para token JWT.
- `expo-web-browser` para abrir páginas web completas (mapa, inbox, dashboard, etc.).

## Entry

- `App.tsx` na raiz de `mobile/` importa `MainApp` de `src/MainApp.tsx` (estrutura actual).

## API

- Base URL: `EXPO_PUBLIC_API_BASE_URL` (ex. `http://10.0.2.2:3000/api/v1` Android emulator, `http://127.0.0.1:3000/api/v1` iOS simulator, IP LAN para dispositivo físico).
- Header `Authorization: Bearer <token>` em rotas protegidas.

## Paridade de funcionalidades (alvo)

- Convidado: feed público, tópicos, pesquisa, ecrã login/registo.
- Autenticado: feed autenticado, tópicos, pesquisa, criar denúncia (título + texto + tags), conta com notificações, “minhas denúncias”, links web, modais: detalhe denúncia, feed por tópico, empresa pública.

## Builds

- **Android:** `package` em `app.json`.
- **iOS:** `bundleIdentifier` em `app.json`; build store via EAS Build no Mac.

Ver `mobile/README.md` no repositório para comandos actualizados.
