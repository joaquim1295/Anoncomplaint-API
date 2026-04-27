# API Migration Progress

## Completed
- Foundation and docs scaffolding:
  - `docs/api-migration-todo.md`
  - `docs/api-migration-prompts.md`
- API base helpers:
  - `src/lib/api/http.ts`
  - `src/lib/api/auth.ts`
  - `src/lib/api/openapi.ts`
- API base endpoints:
  - `GET /api/v1/health`
  - `GET /api/v1/openapi`
  - `GET /api-docs`
- Auth endpoints:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- Public complaint and stats endpoints:
  - `GET /api/v1/complaints`
  - `POST /api/v1/complaints`
  - `GET /api/v1/complaints/search`
  - `GET /api/v1/stats`
- Complaint action endpoints:
  - `POST /api/v1/complaints/{id}/endorse`
  - `DELETE /api/v1/complaints/{id}`
  - `POST /api/v1/complaints/{id}/response`
  - `PATCH /api/v1/complaints/{id}/status`
- Company endpoints:
  - `GET /api/v1/company/complaints`
  - `PATCH /api/v1/company/complaints/{id}/status`
  - `POST /api/v1/company/complaints/{id}/response`
  - `GET /api/v1/company/companies`
  - `POST /api/v1/company/companies`
  - `PATCH /api/v1/company/companies/{id}`
  - `DELETE /api/v1/company/companies/{id}`
- Admin endpoints:
  - `GET /api/v1/admin/users`
  - `POST /api/v1/admin/users/{id}/ban`
  - `GET /api/v1/admin/complaints`
  - `DELETE /api/v1/admin/complaints/{id}`
- Notifications and subscriptions:
  - `GET /api/v1/notifications`
  - `PATCH /api/v1/notifications/{id}/read`
  - `POST /api/v1/subscriptions/{complaintId}/toggle`
- API client bootstrap:
  - `src/lib/api/client.ts`
  - `src/lib/api/endpoints.ts`

## Next
- Expand OpenAPI schema coverage for all created endpoints.
- Migrate frontend modules from Server Actions to API client usage.
- Add integration/contract tests for critical routes.
- Remove obsolete Server Actions once frontend migration is complete.

