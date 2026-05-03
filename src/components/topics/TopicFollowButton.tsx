"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { useI18n } from "../providers/I18nProvider";

export function TopicFollowButton({
  slug,
  initialFollowing,
  isLoggedIn,
}: {
  slug: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
}) {
  const { t } = useI18n();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

  function toggle() {
    if (!isLoggedIn) {
      toast.error(t("topicFollow.loginRequired"));
      return;
    }
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const response = await fetch(`/api/v1/topics/${encodeURIComponent(slug)}/follow`, {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json().catch(() => null);
      const ok = response.ok && typeof result?.data?.following === "boolean";
      if (!ok) {
        setFollowing(!next);
        toast.error(result?.error?.message ?? t("topicFollow.updateError"));
        return;
      }
      setFollowing(result.data.following);
      const key = result.data.following ? "topicFollow.toastNowFollowing" : "topicFollow.toastUnfollowed";
      toast.success(t(key).replace("{{slug}}", slug));
    });
  }

  return (
    <Button
      type="button"
      variant={following ? "default" : "outline"}
      size="sm"
      className="inline-flex items-center gap-2 rounded-xl"
      disabled={pending}
      onClick={toggle}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : following ? (
        <BellRing className="h-4 w-4 text-emerald-200" aria-hidden />
      ) : (
        <Bell className="h-4 w-4" aria-hidden />
      )}
      {following ? t("topicFollow.following") : t("topicFollow.followTopic")}
    </Button>
  );
}
