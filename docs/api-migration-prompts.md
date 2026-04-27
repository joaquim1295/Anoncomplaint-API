# API Migration Prompts

## Prompt 01 - Foundation Bootstrap
Create REST API foundation in Next.js App Router:
1) Add `/api/v1` route structure and shared response/error helpers.
2) Add OpenAPI/Swagger setup with base info, servers, auth scheme (Bearer JWT), and tags.
3) Add `GET /api/v1/health`.
4) Keep existing app behavior intact.
5) Generate `api-foundation-changelog.json`.

## Prompt 02 - API Auth and Role Guards
Implement reusable API auth guards:
1) Support Bearer token extraction and cookie fallback.
2) Add role guard helper for USER/COMPANY/ADMIN.
3) Standardize 401/403 responses.
4) Generate `api-auth-guards-changelog.json`.

## Prompt 03 - Public Read Endpoints
Implement read-only public endpoints:
1) `GET /api/v1/complaints?page&limit`
2) `GET /api/v1/complaints/search?q&page&limit`
3) `GET /api/v1/stats`
Document endpoints in OpenAPI.
Generate `api-public-read-changelog.json`.

## Prompt 04 - Auth Endpoints
Implement REST auth endpoints:
1) `POST /api/v1/auth/register`
2) `POST /api/v1/auth/login`
3) `POST /api/v1/auth/logout`
4) `GET /api/v1/auth/me`
Reuse current auth service semantics.
Generate `api-auth-endpoints-changelog.json`.

## Prompt 05 - Complaint Mutations
Implement complaint write endpoints:
1) `POST /api/v1/complaints`
2) `PATCH /api/v1/complaints/{id}/status`
3) `POST /api/v1/complaints/{id}/endorse`
4) `DELETE /api/v1/complaints/{id}`
Apply Zod validation and auth checks.
Generate `api-complaint-mutations-changelog.json`.

## Prompt 06 - Company and Admin Endpoints
Implement protected business endpoints:
1) Company official response and company dashboard management routes.
2) Admin users/complaints moderation routes.
Enforce role guards and add OpenAPI docs.
Generate `api-company-admin-changelog.json`.

## Prompt 07 - Notifications and Subscriptions
Implement:
1) `POST /api/v1/subscriptions/{complaintId}/toggle`
2) `GET /api/v1/notifications`
3) `PATCH /api/v1/notifications/{id}/read`
Keep current service behavior.
Generate `api-notifications-subscriptions-changelog.json`.

## Prompt 08 - Frontend API Client Layer
Create typed API client and migrate:
1) Home feed
2) Search
3) Load more pagination
No UI regressions.
Generate `frontend-api-client-changelog.json`.

## Prompt 09 - Profile and Company Dashboard Migration
Migrate profile and company dashboard flows from Server Actions to REST.
Keep same UX and permission model.
Generate `frontend-profile-company-rest-changelog.json`.

## Prompt 10 - Server Actions Cleanup
Remove only actions with complete REST equivalents.
Validate no broken routes or imports.
Generate `server-actions-cleanup-changelog.json`.

## Prompt 11 - API Testing
Add contract and integration tests for critical endpoints:
auth, complaints, company/admin authorization.
Generate `api-tests-changelog.json`.

## Prompt 12 - Hardening and Release
Add rate limiting, request IDs, structured logging, and release checklist.
Generate `api-hardening-release-changelog.json`.

