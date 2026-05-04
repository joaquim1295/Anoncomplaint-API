/**
 * Gera o relatório de produto em Word (.docx) para apresentações e defesa do projecto.
 * Execução: npm run report:docx
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  PageBreak,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "src", "docs");
const OUT_FILE = path.join(OUT_DIR, "Relatorio-Produto-SmartComplaint.docx");

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 }, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun(text)] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 80 }, children: [new TextRun(text)] });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, ...opts })],
  });
}
function pb(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, bold: true })],
  });
}
function mono(text) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Consolas", size: 20 })],
  });
}

function table2col(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([a, b]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: a, bold: true })] })],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun(b)] })],
          }),
        ],
      })
    ),
  });
}

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [
      new TextRun({ break: 2 }),
      new TextRun({ text: "SmartComplaint", bold: true, size: 56 }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "Relatório técnico e de produto", size: 36 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "Plataforma de denúncias e reclamações com transparência", italics: true, size: 24 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text: `Documento gerado automaticamente — ${new Date().toLocaleDateString("pt-PT", { year: "numeric", month: "long", day: "numeric" })}`, size: 22 })],
  }),
  new Paragraph({ children: [new PageBreak()] }),

  h1("1. Sumário executivo"),
  p(
    "SmartComplaint é uma aplicação web full-stack, complementada por um cliente móvel (Expo), que permite a cidadãos e consumidores publicar denúncias, associá-las a empresas e tópicos, visualizar estatísticas e mapas de calor, e interagir com empresas verificadas através de respostas oficiais e mensagens. A solução privilegia transparência, moderação de conteúdo, internacionalização (PT/EN/ES) e uma API REST versionada para integrações e mobile."
  ),

  h1("2. Visão do produto e problema"),
  h2("2.1 Problema"),
  p(
    "Consumidores carecem de um canal visível e agregado para expor situações de má experiência com marcas, sem substituir canais oficiais de suporte, mas aumentando a transparência e a pressão reputacional de forma estruturada."
  ),
  h2("2.2 Proposta de valor"),
  p("Feed público de denúncias com pesquisa e filtros; páginas de empresa e de tópico; modo empresa com respostas oficiais; notificações e tempo real; painel administrativo; relatório técnico para stakeholders; documentação OpenAPI."),
  h2("2.3 Personas principais"),
  table2col([
    ["Visitante", "Consulta feed, pesquisa, empresa, tópico e mapa sem autenticação."],
    ["Utilizador registado", "Cria denúncias, comenta em contexto de tópico, gere perfil, inbox e notificações."],
    ["Empresa (modo empresa)", "Responde a denúncias ligadas à entidade, gere estado e mensagens após verificação."],
    ["Administrador", "Modera utilizadores, denúncias e pedidos de verificação de empresa; acede ao relatório técnico."],
  ]),

  h1("3. Stack tecnológico"),
  p("A tabela seguinte resume as tecnologias efectivamente declaradas no ecossistema do repositório (raiz web + mobile)."),
  table2col([
    ["Runtime / Framework", "Node.js; Next.js 15 (App Router); React 19; TypeScript 5."],
    ["UI", "Tailwind CSS 3; Radix UI; class-variance-authority; lucide-react; next-themes."],
    ["Formulários e validação", "react-hook-form; zod; @hookform/resolvers."],
    ["Dados", "MongoDB com Mongoose 8; padrão repositório + serviços em src/lib."],
    ["Autenticação", "JWT assinado com jose; cookie HttpOnly no browser; Bearer token para clientes API/mobile."],
    ["Tempo real", "Pusher Channels (servidor e cliente); endpoint de auth de canais privados."],
    ["Email", "Resend com templates @react-email/components."],
    ["Imagens", "Cloudinary (upload e URLs optimizadas)."],
    ["Mapas", "Leaflet; react-leaflet; leaflet.heat."],
    ["Analytics UI", "Recharts."],
    ["Rate limiting", "Upstash Redis + @upstash/ratelimit (opcional em desenvolvimento)."],
    ["Documentação API", "OpenAPI + Swagger UI (swagger-ui-react)."],
    ["Mobile", "Expo SDK ~54; React Native; AsyncStorage para token."],
    ["Qualidade", "ESLint (next); Prettier; Jest + ts-jest."],
  ]),

  h1("4. Arquitectura do sistema"),
  h2("4.1 Estilo arquitectural"),
  p(
    "Arquitectura em camadas: apresentação (Next.js RSC e componentes cliente), orquestração (route handlers em /api/v1), lógica de negócio (serviços *Service.ts), persistência (repositórios e modelos Mongoose), e integrações externas encapsuladas (email, push, cloud, AI, rate limit)."
  ),
  h2("4.2 Diagrama de componentes (descrição UML)"),
  mono(
    "+------------------+     HTTPS      +---------------------------+\n" +
      "| Browser / Expo   | <-----------> | Next.js (Vercel ou Node)  |\n" +
      "| (Pusher JS)      |               | - App Router UI           |\n" +
      "+--------+---------+               | - middleware (auth/CORS)  |\n" +
      "         |                         | - Route Handlers /api/v1  |\n" +
      "         | Bearer/cookie           +----+----------+-----------+\n" +
      "         +----------------------------------|--------------+\n" +
      "                                            |\n" +
      "              +----------+----------+------+------+----------+\n" +
      "              v          v          v             v          v\n" +
      "         MongoDB    Pusher     Resend      Cloudinary   Upstash\n" +
      "         Atlas      Channels   (email)     (media)      (Redis)"
  ),
  p(
    "O middleware Edge valida JWT para rotas UI privadas, aplica CORS e OPTIONS para /api/v1, e restringe rotas admin-only (ex.: /relatorio). As rotas API validam novamente a sessão e roles onde necessário."
  ),
  h2("4.3 Fluxo de pedido típico (denúncia)"),
  mono(
    "Cliente -> POST /api/v1/complaints -> complaintService -> complaintRepository -> MongoDB\n" +
      "       -> (opcional) notificações / Pusher / email\n" +
      "       <- jsonData (contrato JSON unificado em src/lib/api/http.ts)"
  ),

  h1("5. Modelo de dados (UML / domínio)"),
  p("Entidades principais persistidas em MongoDB (collections Mongoose). Relações conceptuais:"),
  table2col([
    ["User", "Conta: email, password hash+salt, role, perfil público, tópicos seguidos, subscrições de denúncias, tokens de verificação/recuperação."],
    ["Complaint", "Denúncia: autor, conteúdo, tags, empresa, tópico, estado, localização, anexos, respostas oficiais aninhadas, endorsements, rating."],
    ["Company", "Empresa: slug, dono, branding, contagens de visualização."],
    ["Topic", "Hub temático: slug, título, descrição, contagem de denúncias."],
    ["Notification", "Alertas persistidos por utilizador."],
    ["Conversation / DirectMessage", "Inbox: conversas e mensagens entre actores."],
    ["CompanyVerificationRequest", "Workflow de verificação de empresa."],
    ["TopicComplaintComment", "Comentários sobre uma denúncia no contexto de um tópico."],
  ]),
  h2("5.1 Diagrama de classes (simplificado, textual)"),
  mono(
    "[User] 1 ---- * [Complaint] (author_id)\n" +
      "[Company] 1 ---- * [Complaint] (companyId)\n" +
      "[Topic] 1 ---- * [Complaint] (topic_slug)\n" +
      "[User] * ---- * [Topic] (followedTopics)\n" +
      "[User] 1 ---- * [Notification]\n" +
      "[User] 1 ---- * [Conversation] <---- * [DirectMessage]"
  ),

  h1("6. Casos de uso"),
  p("Actores: Visitante, Utilizador autenticado, Empresa (modo empresa), Sistema, Administrador."),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: ["ID", "Caso de uso", "Actor principal", "Resumo"].map((cell) =>
          new TableCell({
            shading: { fill: "D9D9D9" },
            children: [new Paragraph({ children: [new TextRun({ text: cell, bold: true })] })],
          })
        ),
      }),
      ...[
        ["UC-01", "Consultar feed público", "Visitante", "Listagem paginada de denúncias visíveis após regras de moderação."],
        ["UC-02", "Pesquisar denúncias", "Visitante / User", "Texto, empresa, estado, cidade via API de pesquisa."],
        ["UC-03", "Registar e autenticar", "Visitante", "Registo, verificação de email, login JWT + cookie."],
        ["UC-04", "Criar denúncia", "User", "Título, texto, tags, empresa opcional, localização, modo fantasma."],
        ["UC-05", "Ver detalhe e interagir", "User", "Endorse, rating, subscrição, edição limitada pelo autor."],
        ["UC-06", "Responder como empresa", "Empresa", "Resposta oficial e actualização de estado nas denúncias atribuídas."],
        ["UC-07", "Seguir tópico e comentar", "User", "Follow de slug; comentários em queixa no hub."],
        ["UC-08", "Inbox e notificações", "User", "Mensagens directas; alertas persistidos e tempo real (Pusher)."],
        ["UC-09", "Painel admin", "Admin", "Listar/banir utilizadores; moderar denúncias; aprovar/rejeitar verificações."],
        ["UC-10", "Relatório e API docs", "Admin / Dev", "Relatório técnico interno; explorador OpenAPI."],
        ["UC-11", "Mobile Expo", "User", "Paridade de fluxos principais com Bearer token."],
      ].map(
        (cells) =>
          new TableRow({
            children: cells.map((c) => new TableCell({ children: [new Paragraph({ children: [new TextRun(c)] })] })),
          })
      ),
    ],
  }),

  h1("7. Funcionalidades por módulo"),
  h2("7.1 Web pública"),
  p("Home, pesquisa avançada, página de empresa, hub de tópico, detalhe de denúncia, mapa de calor, perfil público por handle."),
  h2("7.2 Área autenticada"),
  p("Perfil, actividades, inbox, notificações, analytics, dashboard empresa (com permissões), troca de modo conta pessoal/empresa."),
  h2("7.3 API REST (/api/v1)"),
  p("Autenticação, denúncias (CRUD filtrado, search, respostas, estado, rating), tópicos, empresas públicas e painel, inbox, notificações, upload, admin, health, OpenAPI."),
  h2("7.4 Internacionalização"),
  p("Mensagens em JSON (pt, en, es); locale no servidor e provider no cliente; metadados SEO por locale."),

  h1("8. Segurança e conformidade operacional"),
  table2col([
    ["Autenticação", "JWT com segredo forte (mínimo 32 caracteres); validação issuer/audience no middleware; cookie HttpOnly para web."],
    ["Autorização", "Middleware para rotas UI; verificação de role admin em rotas sensíveis; revalidação em handlers API."],
    ["Passwords", "bcryptjs + pepper estático (PASSWORD_PEPPER) — nunca armazenar password em claro."],
    ["Transporte", "HTTPS obrigatório em produção; CORS configurável (CORS_ORIGINS)."],
    ["Rate limiting", "Protecção por IP com Upstash quando configurado; confiança em X-Forwarded-For só atrás de proxy controlado."],
    ["Conteúdo", "Estados de moderação (ex.: pending_review); acções de admin e trilhos de auditoria em fluxos críticos."],
    ["Secrets", "Variáveis em ambiente seguro (Vercel/GitHub Secrets); .env.local não versionado."],
    ["Demo / God mode", "Endpoints perigosos condicionados a flags de ambiente (ALLOW_GOD_MODE), desactivados por defeito em produção."],
  ]),

  h1("9. Deploy e operações"),
  h2("9.1 Ambiente recomendado"),
  p(
    "Deploy web típico em Vercel (ou Node com next start). Base de dados MongoDB Atlas. Redis Upstash para rate limit. Contas Pusher, Resend, Cloudinary e (opcional) Groq configuradas via variáveis de ambiente documentadas em .env.local.example."
  ),
  h2("9.2 Variáveis críticas (exemplos)"),
  mono(
    "MONGODB_URI, MONGODB_DB, JWT_SECRET, PASSWORD_PEPPER, NEXT_PUBLIC_APP_URL,\n" +
      "PUSHER_*, NEXT_PUBLIC_PUSHER_*, RESEND_API_KEY, CLOUDINARY_*,\n" +
      "UPSTASH_REDIS_*, CORS_ORIGINS, GROQ_API_KEY (opcional)"
  ),
  h2("9.3 Build e CI"),
  p("npm run build para verificação de tipos e compilação; npm run lint; testes Jest; pipeline GitHub Actions opcional para lint/build."),
  h2("9.4 Mobile"),
  p("Cliente Expo com EXPO_PUBLIC_API_BASE_URL apontando para /api/v1; builds Android/iOS via EAS ou Expo Go em desenvolvimento."),

  h1("10. Observabilidade e extensibilidade"),
  p("Logging estruturado onde existir (src/lib/logger); Sentry opcional conforme wizard; extensão de domínio via novos serviços e route handlers mantendo o contrato jsonData/jsonError."),

  h1("11. Riscos e mitigações"),
  table2col([
    ["Abuso de API", "Rate limit; moderação de conteúdo; validação com zod nos handlers."],
    ["Fuga de dados", "Princípio do menor privilégio nas queries; não expor campos internos nas rotas públicas."],
    ["Disponibilidade", "MongoDB replica set; health check; revalidação ISR onde aplicável."],
  ]),

  h1("12. Conclusão"),
  p(
    "SmartComplaint apresenta uma arquitectura moderna, modular e adequada a apresentações técnicas e de produto: separação clara entre UI, API e dados, integrações bem delimitadas, e superfície de segurança compreensível (JWT, roles, CORS, rate limit). O presente documento resume o essencial para defesa oral acompanhada de demo ao vivo (feed, empresa, resposta oficial, notificação em tempo real e painel admin)."
  ),

  h1("Anexo A — Referências internas ao código"),
  p("src/app — páginas e layouts; src/app/api/v1 — REST; src/middleware.ts — auth UI e CORS; src/lib — serviços; src/models — Mongoose; mobile/ — cliente Expo."),
];

fs.mkdirSync(OUT_DIR, { recursive: true });
const doc = new Document({
  sections: [{ properties: {}, children }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUT_FILE, buffer);
console.log("Escrito:", OUT_FILE);
