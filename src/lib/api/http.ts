export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function jsonData<T>(
  data: T,
  init?: ResponseInit,
  meta?: Record<string, unknown>
): Response {
  return Response.json(
    meta ? { data, meta } : { data },
    { status: 200, ...init }
  );
}

export function jsonError(
  code: string,
  message: string,
  status: number,
  details?: unknown
): Response {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return Response.json(body, { status });
}

export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  offset: number;
} {
  const rawPage = Number(searchParams.get("page") ?? "1");
  const rawLimit = Number(searchParams.get("limit") ?? "20");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(100, Math.floor(rawLimit)) : 20;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

