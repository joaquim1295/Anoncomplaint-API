# Modelo de dados (MongoDB / Mongoose)

Ficheiros em `src/models/`. Cada um exporta schema + tipos `*Document` quando aplicável.

## Lista de modelos

| Modelo | Ficheiro | Responsabilidade |
|--------|----------|------------------|
| **User** | `User.ts` | Conta, password hash+salt, role, ban, email verify/reset, `subscribedComplaints`, `followedTopics`, perfil público |
| **Complaint** | `Complaint.ts` | Denúncia: autor, ghost, empresa, tópico, tags, status, localização, anexos, respostas oficiais aninhadas, endorsements, rating |
| **Company** | `Company.ts` | Empresa: slug, dono, branding, views |
| **Topic** | `Topic.ts` | Hub semântico: slug, título, contagens |
| **Notification** | `Notification.ts` | Notificações persistidas |
| **Conversation** | `Conversation.ts` | Inbox: metadados de conversa |
| **DirectMessage** | `DirectMessage.ts` | Mensagens na conversa |
| **CompanyVerificationRequest** | `CompanyVerificationRequest.ts` | Workflow pedido → aprovação empresa |
| **TopicComplaintComment** | `TopicComplaintComment.ts` | Comentários numa queixa dentro de um tópico |

## Estados de denúncia

Definidos em `src/types/complaint.ts` (`ComplaintStatus`). Incluir estados como rascunho, pendente revisão, público, resolvido, etc., conforme enum real no repo.

## Relações típicas

- `Complaint.author_id` → `User._id` stringificada
- `Complaint.companyId` → `Company`
- `Complaint.topic_slug` → `Topic.slug`
- Empresa “dona” liga `Company` ao `User` dono para permissões de resposta

## Índices e performance

Repositórios (`complaintRepository`, etc.) aplicam filtros por status, empresa, autor, texto — ao reconstruir, replicar índices sugeridos nos schemas ou comentários nos repos.

## Migrações

Mongoose sem migrations formais: evolução por deploy coordenado com scripts pontuais se necessário.
