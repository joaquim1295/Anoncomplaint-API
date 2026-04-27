"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ComplaintDisplay } from "../../types/complaint";
import { ComplaintItem } from "../ComplaintItem";
import { Button } from "../ui/Button";

interface ComplaintFeedProps {
  initialComplaints: ComplaintDisplay[];
  initialHasMore: boolean;
  currentUserId: string | null;
  currentUserRole: string | null;
  subscribedComplaintIds?: string[];
  pageSize: number;
}

export function ComplaintFeed({
  initialComplaints,
  initialHasMore,
  currentUserId,
  currentUserRole,
  subscribedComplaintIds,
  pageSize,
}: ComplaintFeedProps) {
  const [complaints, setComplaints] = useState<ComplaintDisplay[]>(initialComplaints);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [page, setPage] = useState<number>(1);
  const [isPending, startTransition] = useTransition();

  async function handleLoadMore() {
    startTransition(async () => {
      const nextPage = page + 1;
      const qs = new URLSearchParams({
        page: String(nextPage),
        limit: String(pageSize),
      });
      const response = await fetch(`/api/v1/complaints?${qs.toString()}`, {
        method: "GET",
        credentials: "include",
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload?.error?.message ?? "Não foi possível carregar mais denúncias.");
        return;
      }
      const nextComplaints = (payload?.data ?? []) as ComplaintDisplay[];
      const nextHasMore = Boolean(payload?.meta?.hasMore);
      setComplaints((prev) => [...prev, ...nextComplaints]);
      setPage(nextPage);
      setHasMore(nextHasMore);
    });
  }

  return (
    <div className="space-y-4">
      {complaints.map((c) => (
        <ComplaintItem
          key={c.id}
          complaint={c}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          isSubscribed={subscribedComplaintIds?.includes(c.id)}
        />
      ))}
      {hasMore && (
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm"
            disabled={isPending}
            onClick={handleLoadMore}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin text-emerald-300" aria-hidden />}
            <span>Carregar mais</span>
          </Button>
        </div>
      )}
    </div>
  );
}

