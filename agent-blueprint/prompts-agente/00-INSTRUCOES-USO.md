# Como usar estes prompts com um agente

1. **Anexa** a pasta `agent-blueprint/` (ou o repo inteiro) ao chat do agente.
2. Copia o conteúdo de **um** ficheiro `NN-agente-*.md` por tarefa — evita misturar duas fases na mesma mensagem.
3. No final de cada tarefa, pede ao agente que **actualize** o blueprint se a implementação divergir (rotas novas, env novos).
4. Usa `CHECKLIST-RECONSTRUCAO.md` para não saltar dependências (ex.: API antes de UI que consome).

## Formato dos prompts

Todos seguem: **Contexto** → **Objectivo** → **Entregáveis** → **Critérios de aceite** → **Referências** (ficheiros em `conhecimento/`).

Podes acrescentar ao agente: *"Não refactors não pedidos; seguir estilo existente no repo."*
