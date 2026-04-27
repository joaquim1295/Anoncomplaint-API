export interface ApiClientOptions {
  baseUrl?: string;
  token?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly token?: string;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "/api/v1";
    this.token = options.token;
  }

  async get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { method: "GET", ...init });
  }

  async post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });
  }

  async patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });
  }

  async delete<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { method: "DELETE", ...init });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has("content-type") && init.body) {
      headers.set("content-type", "application/json");
    }
    if (this.token) {
      headers.set("authorization", `Bearer ${this.token}`);
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await res.json() : null;

    if (!res.ok) {
      const err = (payload?.error ?? {
        code: "http_error",
        message: `Request failed with status ${res.status}`,
      }) as ApiError;
      throw err;
    }

    return (payload?.data ?? payload) as T;
  }
}

export const apiClient = new ApiClient();

