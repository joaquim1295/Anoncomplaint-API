# AnonComplaint

Plataforma de denúncias anónimas (Next.js 15 + React 19).

## Pré-requisitos

- **Node.js** 18+ (recomendado 20+)
- **MongoDB** a correr localmente (ou URI remota)

## 1. Instalar dependências

```bash
npm install
```

## 2. Variáveis de ambiente

O ficheiro `.env.local` já existe com valores de exemplo. Para produção, altere:

- **MONGODB_URI** – URI de conexão ao MongoDB (ex: `mongodb://localhost:27017/anon_complaint`)
- **JWT_SECRET** – Segredo para assinar os JWT (mín. 32 caracteres)
- **PASSWORD_PEPPER** – Pepper para hash de passwords (opcional; pode usar o mesmo que JWT_SECRET)

Se não tiver `.env.local`, copie a partir do exemplo:

```bash
copy .env.local.example .env.local
```

(No PowerShell: `Copy-Item .env.local.example .env.local`)

## 3. Garantir que o Next usa `src/app`

O projeto está consolidado em **`src/`**. Se existir a pasta **`app/`** na raiz do projeto, remova-a ou renomeie-a para que o Next.js use **`src/app`** (layout, páginas, actions).

## 4. Correr em desenvolvimento

```bash
npm run dev
```

Abre no browser: **http://localhost:3000**

## 5. Outros comandos

- **Build para produção:** `npm run build`
- **Correr em produção:** `npm start` (após `npm run build`)
- **Lint:** `npm run lint`

## Rotas principais

| Rota         | Descrição                          |
|-------------|-------------------------------------|
| `/`         | Home – feed, estatísticas, Rage Meter |
| `/login`    | Iniciar sessão                      |
| `/register` | Registar nova conta                 |
| `/activities` | As minhas actividades (requer login) |
