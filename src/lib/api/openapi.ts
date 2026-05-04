export function getOpenApiSpec() {
  return {
    openapi: "3.0.3",
    info: {
      title: "SmartComplaint API",
      version: "1.0.0",
      description: "REST API for SmartComplaint platform",
    },
    servers: [
      { url: "/api/v1", description: "Current deployment" },
    ],
    tags: [
      { name: "Health", description: "Service status endpoints" },
      { name: "Auth", description: "Authentication and session endpoints" },
      { name: "Complaints", description: "Complaint feed and mutations" },
      { name: "Company", description: "Company dashboard endpoints" },
      { name: "Admin", description: "Administration endpoints" },
      { name: "Notifications", description: "Notification endpoints" },
      { name: "Inbox", description: "Direct messages between users and companies" },
      { name: "Media", description: "Image upload (Cloudinary)" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ApiEnvelope: {
          type: "object",
          properties: {
            data: {},
            meta: { type: "object", additionalProperties: true },
          },
          required: ["data"],
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: {},
              },
              required: ["code", "message"],
            },
          },
          required: ["error"],
        },
        HealthData: {
          type: "object",
          properties: {
            status: { type: "string", example: "ok" },
            service: { type: "string", example: "smart-complaint-api" },
            version: { type: "string", example: "v1" },
            now: { type: "string", format: "date-time" },
            checks: {
              type: "object",
              properties: { mongodb: { type: "boolean" } },
            },
            pusher_configured: { type: "boolean" },
          },
          required: ["status", "service", "version", "now"],
        },
        AuthLoginRequest: {
          type: "object",
          properties: {
            emailOrUsername: { type: "string" },
            password: { type: "string" },
          },
          required: ["emailOrUsername", "password"],
        },
        AuthRegisterRequest: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            username: { type: "string" },
            password: { type: "string", minLength: 8 },
            role: { type: "string", enum: ["user", "company"] },
          },
          required: ["email", "password"],
        },
        ComplaintCreateRequest: {
          type: "object",
          properties: {
            title: { type: "string", maxLength: 100 },
            company_id: { type: "string" },
            content: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            ghost_mode: { type: "boolean" },
            location_city: { type: "string" },
            location_lat: { type: "number" },
            location_lng: { type: "number" },
          },
          required: ["title", "content"],
        },
        ComplaintStatusUpdateRequest: {
          type: "object",
          properties: {
            status: { type: "string" },
          },
          required: ["status"],
        },
        OfficialResponseRequest: {
          type: "object",
          properties: {
            companyId: { type: "string" },
            content: { type: "string", minLength: 10, maxLength: 2000 },
          },
          required: ["companyId", "content"],
        },
        OfficialResponseReplyRequest: {
          type: "object",
          properties: {
            content: { type: "string", minLength: 2, maxLength: 1500 },
            parentReplyId: { type: "string" },
          },
          required: ["content"],
        },
        CompanyVerificationRequestRow: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            email: { type: "string", format: "email" },
            companyName: { type: "string" },
            companyWebsite: { type: "string" },
            contactName: { type: "string" },
            status: { type: "string", enum: ["pending", "email_verified", "approved", "rejected"] },
            expiresAt: { type: "string", format: "date-time" },
            emailVerifiedAt: { type: "string", format: "date-time", nullable: true },
            created_at: { type: "string", format: "date-time" },
          },
          required: ["id", "userId", "email", "companyName", "companyWebsite", "contactName", "status", "expiresAt", "created_at"],
        },
        CompanyPayload: {
          type: "object",
          properties: {
            name: { type: "string" },
            taxId: { type: "string" },
            website: { type: "string" },
            description: { type: "string" },
          },
          required: ["name"],
        },
        UpdateUsernameRequest: {
          type: "object",
          properties: { username: { type: "string" } },
          required: ["username"],
        },
        UpdatePasswordRequest: {
          type: "object",
          properties: {
            currentPassword: { type: "string" },
            newPassword: { type: "string", minLength: 8 },
            confirmPassword: { type: "string" },
          },
          required: ["currentPassword", "newPassword", "confirmPassword"],
        },
        UpdateRoleRequest: {
          type: "object",
          properties: {
            company_name: { type: "string" },
            company_website: { type: "string" },
            company_contact_name: { type: "string" },
          },
          required: ["company_name", "company_website", "company_contact_name"],
        },
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          responses: {
            "200": {
              description: "Service is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/HealthData" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
          },
        },
      },
      "/openapi": {
        get: {
          tags: ["Health"],
          summary: "OpenAPI specification",
          responses: {
            "200": {
              description: "OpenAPI document",
            },
          },
        },
      },
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthRegisterRequest" },
              },
            },
          },
          responses: {
            "201": { description: "User created" },
            "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthLoginRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Logged in" },
            "401": { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout user",
          responses: { "200": { description: "Logged out" } },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Current authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Current user" },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/complaints": {
        get: {
          tags: ["Complaints"],
          summary: "List public complaints",
          parameters: [
            { in: "query", name: "page", schema: { type: "integer", minimum: 1 } },
            { in: "query", name: "limit", schema: { type: "integer", minimum: 1 } },
          ],
          responses: { "200": { description: "Complaint list" } },
        },
        post: {
          tags: ["Complaints"],
          summary: "Create complaint",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ComplaintCreateRequest" },
              },
            },
          },
          responses: {
            "201": { description: "Complaint created" },
            "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/upload/image": {
        post: {
          tags: ["Media"],
          summary: "Upload image (data URI) to Cloudinary",
          description: "Requires CLOUDINARY_* env. Rate limited per IP. Use folder `profiles` only when authenticated.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    image: { type: "string", description: "data:image/...;base64,..." },
                    folder: { type: "string", enum: ["complaints", "profiles"], default: "complaints" },
                  },
                  required: ["image"],
                },
              },
            },
          },
          responses: {
            "200": { description: "Returns { data: { url } }" },
            "400": { description: "Invalid image or upload error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "401": { description: "Unauthorized (profiles folder)", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "429": { description: "Rate limit", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "503": { description: "Cloudinary not configured", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/complaints/search": {
        get: {
          tags: ["Complaints"],
          summary: "Search complaints",
          parameters: [
            { in: "query", name: "q", required: true, schema: { type: "string" } },
            { in: "query", name: "page", schema: { type: "integer", minimum: 1 } },
            { in: "query", name: "limit", schema: { type: "integer", minimum: 1 } },
          ],
          responses: {
            "200": { description: "Search results" },
            "400": { description: "Invalid query", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/complaints/{id}": {
        delete: {
          tags: ["Complaints"],
          summary: "Delete complaint by owner",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Deleted" },
            "400": { description: "Delete failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/complaints/{id}/endorse": {
        post: {
          tags: ["Complaints"],
          summary: "Toggle endorsement",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Endorsement updated" },
            "400": { description: "Operation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/complaints/{id}/status": {
        patch: {
          tags: ["Complaints"],
          summary: "Update complaint status (company flow)",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ComplaintStatusUpdateRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Status updated" },
            "400": { description: "Validation/update error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/complaints/{id}/response": {
        post: {
          tags: ["Complaints"],
          summary: "Add official response",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OfficialResponseRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Response added" },
            "400": { description: "Operation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/complaints/{id}/ai-summary": {
        post: {
          tags: ["Complaints"],
          summary: "Generate AI summary (ai_summary)",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "AI summary generated" },
            "404": { description: "Denúncia não encontrada" },
          },
        },
      },
      "/complaints/{id}/responses/{responseId}/replies": {
        post: {
          tags: ["Complaints"],
          summary: "Create reply/triplica to an official response",
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "path", name: "id", required: true, schema: { type: "string" } },
            { in: "path", name: "responseId", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OfficialResponseReplyRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Reply created" },
            "400": { description: "Operation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/stats": {
        get: {
          tags: ["Complaints"],
          summary: "Get dashboard stats",
          responses: { "200": { description: "Stats data" } },
        },
      },
      "/company/complaints": {
        get: {
          tags: ["Company"],
          summary: "List complaints managed by company user",
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "query", name: "page", schema: { type: "integer", minimum: 1 } },
            { in: "query", name: "limit", schema: { type: "integer", minimum: 1 } },
          ],
          responses: {
            "200": { description: "Company complaints" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/company/complaints/{id}/status": {
        patch: {
          tags: ["Company"],
          summary: "Update complaint status as company",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ComplaintStatusUpdateRequest" },
              },
            },
          },
          responses: { "200": { description: "Updated" }, "400": { description: "Update failed" } },
        },
      },
      "/company/complaints/{id}/response": {
        post: {
          tags: ["Company"],
          summary: "Add official response as company",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OfficialResponseRequest" },
              },
            },
          },
          responses: { "200": { description: "Response added" }, "400": { description: "Failed" } },
        },
      },
      "/company/verification/confirm": {
        get: {
          tags: ["Company"],
          summary: "Confirm company verification email token",
          parameters: [
            { in: "query", name: "token", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Token confirmed" },
            "400": { description: "Invalid or expired token", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "404": { description: "Request not found" },
          },
        },
      },
      "/company/companies": {
        get: {
          tags: ["Company"],
          summary: "List companies for current user",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Companies list" } },
        },
        post: {
          tags: ["Company"],
          summary: "Create company for current user",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CompanyPayload" },
              },
            },
          },
          responses: { "201": { description: "Company created" }, "400": { description: "Validation failed" } },
        },
      },
      "/company/companies/{id}": {
        patch: {
          tags: ["Company"],
          summary: "Update company",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CompanyPayload" },
              },
            },
          },
          responses: { "200": { description: "Company updated" }, "404": { description: "Not found" } },
        },
        delete: {
          tags: ["Company"],
          summary: "Delete company (owner or admin)",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Company deleted" }, "404": { description: "Not found" } },
        },
      },
      "/admin/god-mode/force-approve": {
        post: {
          tags: ["Admin"],
          summary: "God mode: force approve current admin as company",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Current user promoted to company" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/admin/god-mode/simulate-response": {
        post: {
          tags: ["Admin"],
          summary: "God mode: trigger simulated realtime response",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Realtime event dispatched" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/admin/god-mode/reset-demo": {
        post: {
          tags: ["Admin"],
          summary: "God mode: reset demo complaint data",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Demo data reset" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/company/public/{slug}/view": {
        post: {
          tags: ["Company"],
          summary: "Increment company profile views",
          parameters: [{ in: "path", name: "slug", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "View count incremented" },
            "404": { description: "Company not found" },
          },
        },
      },
      "/company/public/search": {
        get: {
          tags: ["Company"],
          summary: "Search public companies by name",
          parameters: [{ in: "query", name: "q", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Company suggestions" } },
        },
      },
      "/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "List users (admin)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Users list" }, "403": { description: "Forbidden" } },
        },
      },
      "/admin/users/{id}/ban": {
        post: {
          tags: ["Admin"],
          summary: "Ban user (admin)",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "User banned" }, "404": { description: "Not found" } },
        },
      },
      "/admin/complaints": {
        get: {
          tags: ["Admin"],
          summary: "List complaints (admin)",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Complaints list" } },
        },
      },
      "/admin/complaints/{id}": {
        delete: {
          tags: ["Admin"],
          summary: "Force delete complaint (admin)",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Complaint deleted" }, "404": { description: "Not found" } },
        },
      },
      "/admin/company-requests": {
        get: {
          tags: ["Admin"],
          summary: "List company verification requests",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Requests list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/CompanyVerificationRequestRow" },
                      },
                    },
                  },
                },
              },
            },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/admin/company-requests/{id}/approve": {
        post: {
          tags: ["Admin"],
          summary: "Approve company verification request",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    approveWithoutEmailVerification: {
                      type: "boolean",
                      description: "When true, admin may approve while request status is still pending (email not verified).",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Request approved" },
            "400": { description: "Approve failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/admin/company-requests/{id}/reject": {
        post: {
          tags: ["Admin"],
          summary: "Reject company verification request",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Request rejected" },
            "400": { description: "Reject failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/notifications": {
        get: {
          tags: ["Notifications"],
          summary: "List current user notifications",
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: "query", name: "page", schema: { type: "integer", minimum: 1 } },
            { in: "query", name: "limit", schema: { type: "integer", minimum: 1 } },
          ],
          responses: { "200": { description: "Notifications list" } },
        },
      },
      "/notifications/{id}/read": {
        patch: {
          tags: ["Notifications"],
          summary: "Mark notification as read",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Notification updated" }, "404": { description: "Not found" } },
        },
      },
      "/inbox/conversations": {
        get: {
          tags: ["Inbox"],
          summary: "List inbox conversations for current actor",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Conversation list" }, "401": { description: "Unauthorized" } },
        },
        post: {
          tags: ["Inbox"],
          summary: "Create or get a conversation",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    companyId: { type: "string" },
                    userId: { type: "string" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Conversation created or reused" },
            "400": { description: "Invalid payload", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/inbox/conversations/{id}/messages": {
        get: {
          tags: ["Inbox"],
          summary: "List messages from a conversation",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Message list" },
            "403": { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
        post: {
          tags: ["Inbox"],
          summary: "Send message to a conversation",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { content: { type: "string" } },
                  required: ["content"],
                },
              },
            },
          },
          responses: {
            "201": { description: "Message sent" },
            "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "403": { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/inbox/conversations/{id}/read": {
        patch: {
          tags: ["Inbox"],
          summary: "Mark conversation messages as read for current actor",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Marked read" },
            "403": { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/subscriptions/{complaintId}/toggle": {
        post: {
          tags: ["Notifications"],
          summary: "Toggle complaint subscription",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "complaintId", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Subscription toggled" }, "400": { description: "Operation failed" } },
        },
      },
      "/users/me/username": {
        patch: {
          tags: ["Auth"],
          summary: "Update current user username",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateUsernameRequest" },
              },
            },
          },
          responses: { "200": { description: "Username updated" }, "400": { description: "Validation failed" } },
        },
      },
      "/users/me/password": {
        patch: {
          tags: ["Auth"],
          summary: "Update current user password",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdatePasswordRequest" },
              },
            },
          },
          responses: { "200": { description: "Password updated" }, "400": { description: "Validation failed" } },
        },
      },
      "/users/me/role": {
        patch: {
          tags: ["Auth"],
          summary: "Activate company role for current user",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateRoleRequest" },
              },
            },
          },
          responses: { "200": { description: "Role updated" }, "400": { description: "Validation failed" } },
        },
        delete: {
          tags: ["Auth"],
          summary: "Deactivate company role for current user",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Role deactivated to user" },
            "400": { description: "Deactivate failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/ai/context/{complaintId}": {
        get: {
          tags: ["Complaints"],
          summary: "Get AI context and related complaints",
          parameters: [{ in: "path", name: "complaintId", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "AI context result" }, "404": { description: "Complaint not found" } },
        },
      },
    },
  };
}

