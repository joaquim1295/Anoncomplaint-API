# Deploy API na Vercel + GitHub

## 1) Preparar repositório Git local

```bash
cd "c:\vibecoding 3"
git init
git add .
git commit -m "prepare api for vercel deployment"
```

### Se o build na Vercel falhar com “Module not found … components/…”

O `.gitignore` deve **não** ignorar `src/components`. Use apenas padrões com `/` no início para pastas na raiz do repo (ex.: `/components/` para a pasta legada na raiz, não `components/`).

Depois de corrigir o ignore, confirme que o Git vê os ficheiros:

```bash
git add -f src/components
git status
```

## 2) Criar repositório no GitHub e enviar

```bash
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

## 3) Importar projeto na Vercel

1. Acesse [https://vercel.com/new](https://vercel.com/new)
2. Selecione o repositório
3. Framework: Next.js (detectado automaticamente)
4. Deploy

## 4) Variáveis de ambiente na Vercel

Defina em **Project Settings -> Environment Variables**:

- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_COOKIE_NAME` (opcional)
- `RESEND_API_KEY` (se usar email)
- `CORS_ORIGINS` (CSV de origens permitidas)
  - Exemplo produção:
    - `https://seu-frontend.vercel.app,http://localhost:8081,http://localhost:3000`
  - Para liberar geral (não recomendado em produção):
    - `*`

## 5) Confirmar API publicada

- OpenAPI: `https://SEU_PROJETO.vercel.app/api/v1/openapi`
- Health: `https://SEU_PROJETO.vercel.app/api/v1/health`
- Swagger UI: `https://SEU_PROJETO.vercel.app/api-docs`

## 6) Configurar app Android (Expo)

No `mobile/.env`:

```bash
EXPO_PUBLIC_API_BASE_URL=https://SEU_PROJETO.vercel.app/api/v1
```

Depois:

```bash
cd mobile
npm run start -- --clear
```

