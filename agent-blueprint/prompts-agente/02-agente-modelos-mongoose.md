# Prompt agente — Fase 1: Modelos Mongoose e repositórios base

## Contexto

A camada de dados usa **MongoDB** e **Mongoose**. Os documentos de domínio estão descritos em `conhecimento/05-modelo-dados.md`.

## Objectivo

Implementar todos os schemas em `src/models/` e criar repositórios em `src/lib/repositories/` com as operações necessárias aos serviços (find, list, aggregate, update) — começando por **User** e **Complaint**, depois Company, Topic, Notification, Conversation, DirectMessage, CompanyVerificationRequest, TopicComplaintComment.

## Entregáveis

- Um ficheiro por modelo com export do model compilado (padrão anti-redefinição em hot reload).
- Tipos TS `*Document` ou equivalentes alinhados a `src/types/*`.
- Repositórios com funções puras de persistência (sem HTTP).

## Critérios de aceite

- Índices sensatos (email único, slug único empresa/tópico, queries frequentes).
- Nenhuma lógica de negócio complexa nos repositórios (só dados).
- `getConnection()` utilizado antes de queries.

## Referências

- `conhecimento/05-modelo-dados.md`
- `conhecimento/03-arquitetura-pastas.md`
