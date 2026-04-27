import { getToken } from "../storage/auth";
import type { ApiError } from "../types";

const DEFAULT_API_BASE_URL = "http://10.0.2.2:3000/api/v1";
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

type RequestOptions = RequestInit & { auth?: boolean };

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.auth ? await getToken() : null;
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as { data?: T } & ApiError;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Request failed (${response.status})`);
  }

  return (payload.data as T) ?? (payload as unknown as T);
}

