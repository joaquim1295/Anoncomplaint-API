# Agent Blueprint — SmartComplaint

Esta pasta **não faz parte do código-fonte** (`src/`). Contém engenharia reversa em forma de documentação e **prompts prontos** para pedir a agentes de IA que reconstruam ou estendam o projeto de forma consistente.

## Como usar

1. Lê primeiro **`CHECKLIST-RECONSTRUCAO.md`** para a ordem sugerida de fases.
2. Para contexto técnico profundo, consulta os ficheiros em **`conhecimento/`** (stack, dados, API, páginas, componentes).
3. Para trabalho delegado a um agente, copia um ficheiro de **`prompts-agente/`** (ou blocos dentro dele) para o chat e anexa **este diretório** ou ficheiros relevantes como contexto.

## Conteúdo

| Secção | Ficheiro / pasta | Finalidade |
|--------|------------------|------------|
| Ordem de obra | `CHECKLIST-RECONSTRUCAO.md` | Sequência mínima viável até paridade com o produto actual |
| Know-how | `conhecimento/` | Arquitectura, convenções, catálogo de rotas e features |
| Prompts | `prompts-agente/` | Blueprints copy-paste por fase ou por área |
| Micro-prompts | `prompts-agente/PROMPTS-MICRO-POR-PAGINA.md` | Um bloco curto por rota `page.tsx` |

### Árvore sugerida

```
agent-blueprint/
├── README.md
├── CHECKLIST-RECONSTRUCAO.md
├── conhecimento/
│   ├── 01-visao-produto.md
│   ├── 02-stack.md
│   ├── 03-arquitetura-pastas.md
│   ├── 04-environment-variables.md
│   ├── 05-modelo-dados.md
│   ├── 06-auth-sessao.md
│   ├── 07-catalogo-api-rest.md
│   ├── 08-features-por-dominio.md
│   ├── 09-paginas-app-router.md
│   ├── 10-componentes-chave.md
│   ├── 11-integracoes-terceiros.md
│   ├── 12-mobile-expo.md
│   └── 13-testes-e-qualidade.md
└── prompts-agente/
    ├── 00-INSTRUCOES-USO.md
    ├── 01-agente-fundacao-nextjs.md … 14-agente-qa-build-ci.md
    └── PROMPTS-MICRO-POR-PAGINA.md
```

## Regras para agentes (resumo)

- Não inventar endpoints: seguir `conhecimento/07-catalogo-api-rest.md`.
- Manter convenções de `src/lib/api/http.ts` (respostas JSON, erros).
- Respeitar `src/middleware.ts` para rotas privadas e admin.
- Mobile em `mobile/` (Expo); API base `/api/v1`.

Quando o código real divergir destes documentos, **o código no repositório prevalece** — actualiza o blueprint depois de mudanças grandes.
