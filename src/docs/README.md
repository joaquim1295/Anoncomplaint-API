# Documentação em `src/docs`

## Relatório de produto (.docx)

- **Ficheiro:** `Relatorio-Produto-SmartComplaint.docx`
- **Conteúdo:** visão do produto, stack, arquitectura, UML textual (componentes e classes), casos de uso, funcionalidades, segurança, deploy e conclusões — adequado a apresentações e defesa do projecto.

Para **regenerar** o Word após alterações ao script:

```bash
npm run report:docx
```

O gerador está em `scripts/generate-relatorio-produto-docx.mjs` (dependência `docx` em dev).
