# API Migration Todo

## Goal
Migrate from Next.js Server Actions coupling to a scalable REST API with OpenAPI/Swagger, preserving current behavior during rollout.

## Phase 0 - Contract and Governance
- Define API base path: `/api/v1`
- Standardize response envelope:
  - success: `{ data, meta? }`
  - error: `{ error: { code, message, details? } }`
- Define pagination contract: `page`, `limit`, `hasMore`, `total?`
- Define authentication contract for external clients:
  - `Authorization: Bearer <jwt>`
  - cookie fallback for web compatibility
- Define API versioning and deprecation policy

## Phase 1 - Foundation
- Create `GET /api/v1/health`
- Create `GET /api/v1/openapi` with base schema
- Add shared API helpers:
  - response/error helpers
  - pagination parser
  - auth/role guards
- Add API docs endpoint/page

## Phase 2 - Public Read Endpoints
- `GET /api/v1/complaints`
- `GET /api/v1/complaints/search`
- `GET /api/v1/stats`
- Keep existing frontend behavior intact

## Phase 3 - Auth and Write Endpoints
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/complaints`
- `PATCH /api/v1/complaints/{id}/status`
- `POST /api/v1/complaints/{id}/endorse`
- `DELETE /api/v1/complaints/{id}`

## Phase 4 - Protected Business Endpoints
- Company dashboard endpoints
- Admin endpoints
- Notifications and subscriptions endpoints

## Phase 5 - Frontend Decoupling
- Introduce typed API client
- Migrate pages/components from Server Actions to REST calls
- Use feature flags where needed

## Phase 6 - Quality and Operations
- Contract tests for OpenAPI consistency
- Integration tests for critical endpoints
- Structured logging and request IDs
- Rate limiting and security hardening

## Phase 7 - Legacy Cleanup
- Remove obsolete Server Actions
- Remove dead imports and duplicate pathways
- Final API consumer guide

