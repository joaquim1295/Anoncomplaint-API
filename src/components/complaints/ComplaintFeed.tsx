"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ComplaintDisplay } from "../../types/complaint";
import { ComplaintItem } from "../ComplaintItem";
import { TopicComplaintRow } from "../topics/TopicComplaintRow";
import { Button } from "../ui/Button";
import { useI18n } from "../providers/I18nProvider";
import { getPusherClient } from "../../lib/realtime/pusher-client";

interface ComplaintFeedProps {
  initialComplaints: ComplaintDisplay[];
  initialHasMore: boolean;
  currentUserId: string | null;
  currentUserRole: string | null;
  subscribedComplaintIds?: string[];
  pageSize: number;
  companyFilterId?: string | null;
  /** Filtra o feed por tópico (slug); usado em /t/[slug]. */
  topicSlug?: string | null;
  /** Abre comentários desta denúncia (query `openComments` na página do tópico). */
  openCommentsComplaintId?: string | null;
}

export function ComplaintFeed({
  initialComplaints,
  initialHasMore,
  currentUserId,
  currentUserRole,
  subscribedComplaintIds,
  pageSize,
  companyFilterId,
  topicSlug,
  openCommentsComplaintId,
}: ComplaintFeedProps) {
  const { t } = useI18n();
  const [complaints, setComplaints] = useState<ComplaintDisplay[]>(initialComplaints);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [page, setPage] = useState<number>(1);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setComplaints(initialComplaints);
    setHasMore(initialHasMore);
    setPage(1);
  }, [initialComplaints, initialHasMore]);

  const fetchFirstPage = useCallback(async () => {
    const qs = new URLSearchParams({
      page: "1",
      limit: String(pageSize),
    });
    if (companyFilterId) qs.set("company", companyFilterId);
    if (topicSlug) qs.set("topic", topicSlug);
    const response = await fetch(`/api/v1/complaints?${qs.toString()}`, {
      method: "GET",
      credentials: "include",
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload?.error?.message ?? t("complaintFeed.loadError"));
      return;
    }
    const nextComplaints = (payload?.data ?? []) as ComplaintDisplay[];
    const nextHasMore = Boolean(payload?.meta?.hasMore);
    setComplaints(nextComplaints);
    setPage(1);
    setHasMore(nextHasMore);
  }, [companyFilterId, topicSlug, pageSize, t]);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;
    const channel = pusher.subscribe("complaints-feed");
    const onUpdated = () => {
      void fetchFirstPage();
    };
    channel.bind("complaint-updated", onUpdated);
    return () => {
      channel.unbind("complaint-updated", onUpdated);
      pusher.unsubscribe("complaints-feed");
    };
  }, [fetchFirstPage]);

  async function handleLoadMore() {
    startTransition(async () => {
      const nextPage = page + 1;
      const qs = new URLSearchParams({
        page: String(nextPage),
        limit: String(pageSize),
      });
      if (companyFilterId) qs.set("company", companyFilterId);
      if (topicSlug) qs.set("topic", topicSlug);
      const response = await fetch(`/api/v1/complaints?${qs.toString()}`, {
        method: "GET",
        credentials: "include",
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload?.error?.message ?? t("complaintFeed.loadError"));
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
      {complaints.map((c) =>
        topicSlug ? (
          <TopicComplaintRow
            key={c.id}
            complaint={c}
            topicSlug={topicSlug}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            isSubscribed={Boolean(subscribedComplaintIds?.includes(c.id))}
            initialOpenComments={Boolean(openCommentsComplaintId && openCommentsComplaintId === c.id)}
          />
        ) : (
          <ComplaintItem
            key={c.id}
            complaint={c}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            isSubscribed={Boolean(subscribedComplaintIds?.includes(c.id))}
          />
        )
      )}
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
            <span>{t("complaintFeed.loadMore")}</span>
          </Button>
        </div>
      )}
    </div>
  );
}

