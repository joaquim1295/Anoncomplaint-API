# Micro-prompts por página (copy-paste)

Usa como **extensão** de um prompt de fase maior. Cada bloco assume API e layout já existentes.

---

## `/` (home)

> Implementa `src/app/page.tsx` da SmartComplaint: feed de denúncias públicas, barra de pesquisa para `/pesquisa`, bloco de actividade recente (`LiveActivityFeed` ou equivalente), RSC com `Promise.all` onde fizer sentido. Usa `getI18n` / `getMessage` para strings. Reutiliza `ComplaintFeed` ou cartões existentes.

---

## `/login` e `/register`

> Páginas `login/page.tsx` e `register/page.tsx` com formulários `LoginForm` e `RegisterForm`, validação client + mensagens de erro da API. Após sucesso, redireccionar para `/` e refrescar sessão. Layout sem nav completa (header compacto via middleware).

---

## `/pesquisa`

> Página de pesquisa com query string; consome `GET /api/v1/complaints/search?q=...`; listagem com links para `/reclamacao/[id]`; estado vazio e loading.

---

## `/reclamacao/[id]`

> Página dinâmica: fetch denúncia por id; mostrar status, conteúdo, empresa (link `/empresa/[slug]`), tópico, respostas oficiais, endorse/rating se autenticado e elegível; acções de autor (editar/apagar). `generateMetadata` com título truncado.

---

## `/empresa/[slug]`

> Página pública da empresa: `GET /company/public/[slug]`, logo, descrição, contador de views, lista de denúncias com paginação. Tratar 404.

---

## `/t/[slug]` e `/topicos`

> `/topicos`: grelha ou lista de `GET /topics`. `/t/[slug]`: feed filtrado por tópico, botão seguir, comentários por queixa, dialog para nova denúncia pré-etiquetada com o tópico.

---

## `/mapa`

> Client component ou dynamic import: mapa Leaflet com heat das denúncias com coordenadas; legenda; fallback sem dados.

---

## `/perfil`

> Página privada: formulário de perfil, upload avatar (Cloudinary), toggles, link para inbox. Guardar via rotas `users/me/*`.

---

## `/inbox`

> Lista de conversas + vista de mensagens; polling ou Pusher; marcar lidas ao abrir.

---

## `/notificacoes`

> Lista de notificações; marcar lida; deep link para `/reclamacao/[id]` quando `complaintId` existir.

---

## `/dashboard-empresa`

> Layout empresa: gestão de dados da empresa e lista de denúncias atribuídas com resposta e mudança de estado; só para dono/conta empresa.

---

## `/analytics`

> Dashboard com gráficos Recharts alimentados pelos endpoints/serviços de analytics do projecto.

---

## `/admin`

> Consola admin: tabs ou secções para users, complaints, company requests; acções ban/approve/reject com confirmação.

---

## `/relatorio`

> Página só **admin**: conteúdo técnico/relatório conforme implementação actual; bloquear UI se `user.role` não for admin.

---

## `/u/[handle]`

> Perfil público: resolver handle a user; 404 se desactivado ou inexistente; mostrar bio, avatar, lista pública de actividade/denúncias conforme política.

---

## `/api-docs`

> Página cliente que carrega `GET /api/v1/openapi` e renderiza `SwaggerUI` em modo seguro (CSS bundlado).

---

## `/verificar-email` e `/verificar-empresa`

> Páginas de fluxo: ler token da query; chamar API; mostrar sucesso/erro e link para login ou dashboard.

---

## `/atividade` e `/activities`

> Alinhar com uma única fonte de dados de actividade do utilizador; evitar duplicação de lógica — documentar redirect se uma rota for alias da outra.

---

## `/redefinir-password`

> UI em dois passos: pedido (email) e reset com token (nova password).
