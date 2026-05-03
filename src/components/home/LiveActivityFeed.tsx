"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { getPusherClient } from "../../lib/realtime/pusher-client";
import { useI18n } from "../providers/I18nProvider";

export type LiveActivityItem = {
  complaintId: string;
  companyName: string;
  content: string;
  createdAt: string;
  pulse?: boolean;
};

type RawInteraction = {
  complaintId: string;
  companyName: string;
  createdAt: string | Date;
  content?: string;
  text?: string;
};

function normalizeItem(data: RawInteraction): LiveActivityItem {
  const createdAt =
    typeof data.createdAt === "string" ? data.createdAt : new Date(data.createdAt).toISOString();
  return {
    complaintId: data.complaintId,
    companyName: data.companyName,
    content: data.content ?? data.text ?? "",
    createdAt,
  };
}

export function LiveActivityFeed({ initialItems }: { initialItems: LiveActivityItem[] }) {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<LiveActivityItem[]>(initialItems);
  const [mountedTime, setMountedTime] = useState<Record<string, string>>({});
  const dateLocaleTag = locale === "en" ? "en-GB" : locale === "es" ? "es" : "pt-PT";

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const item of items) {
      map[`${item.complaintId}-${item.createdAt}`] = new Date(item.createdAt).toLocaleString(dateLocaleTag);
    }
    setMountedTime(map);
  }, [items, dateLocaleTag]);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;
    const channel = pusher.subscribe("public-feed");
    channel.bind("new-interaction", (data: RawInteraction) => {
      const base = normalizeItem(data);
      const next: LiveActivityItem = { ...base, pulse: true };
      setItems((prev) => [next, ...prev].slice(0, 3));
      setTimeout(() => {
        setItems((prev) =>
          prev.map((i) =>
            i.complaintId === next.complaintId && i.createdAt === next.createdAt ? { ...i, pulse: false } : i
          )
        );
      }, 2500);
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe("public-feed");
    };
  }, []);

  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/90 p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/40 dark:shadow-none">
      <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        <Activity className="h-4 w-4 text-emerald-700 dark:text-emerald-300" aria-hidden />
        {t("liveActivity.title")}
      </h3>
      <div className="space-y-2">
        {items.map((item) => {
          const key = `${item.complaintId}-${item.createdAt}`;
          return (
            <div
              key={key}
              className={`rounded-xl border border-zinc-200/80 bg-white/90 p-3 text-xs text-zinc-800 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/50 dark:text-zinc-200 ${
                item.pulse ? "animate-pulse" : ""
              }`}
            >
              <p className="text-zinc-700 dark:text-zinc-300">
                {t("liveActivity.lineBefore")}
                {item.companyName}
                {t("liveActivity.lineAfter")}
              </p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">{item.content}</p>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-500">{mountedTime[key] ?? "-"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
