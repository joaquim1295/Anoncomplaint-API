export function getOpenApiSpec() {
  return {
    openapi: "3.0.3",
    info: {
      title: "AnonComplaint API",
      version: "1.0.0",
      description: "REST API for AnonComplaint platform",
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
            service: { type: "string", example: "anon-complaint-api" },
            version: { type: "string", example: "v1" },
            now: { type: "string", format: "date-time" },
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
            content: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            ghost_mode: { type: "boolean" },
            location_city: { type: "string" },
            location_lat: { type: "number" },
            location_lng: { type: "number" },
          },
          required: ["content"],
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
            content: { type: "string", minLength: 10, maxLength: 2000 },
          },
          required: ["content"],
        },
        CompanyPayload: {
          type: "object",
          properties: {
            name: { type: "string" },
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
            role: { type: "string", enum: ["company"] },
          },
          required: ["role"],
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
          summary: "Delete company",
          security: [{ bearerAuth: [] }],
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Company deleted" }, "404": { description: "Not found" } },
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

