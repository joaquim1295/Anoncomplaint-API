import type { ComplaintDisplay } from "../../types/complaint";
import { apiClient } from "./client";

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export async function fetchPublicComplaints(page = 1, limit = 20) {
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const data = await apiClient.get<ComplaintDisplay[]>(`/complaints?${qs.toString()}`);
  return data;
}

export async function searchPublicComplaints(query: string, page = 1, limit = 20) {
  const qs = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(limit),
  });
  const data = await apiClient.get<ComplaintDisplay[]>(`/complaints/search?${qs.toString()}`);
  return data;
}

