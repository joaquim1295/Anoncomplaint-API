"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Textarea } from "../../components/ui/Textarea";
import { useI18n } from "../../components/providers/I18nProvider";

export function TopicHubCreateForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const titleTrim = title.trim();
    if (titleTrim.length < 2) {
      toast.error(t("topicos.toastTitleTooShort"));
      return;
    }
    startTransition(async () => {
      const response = await fetch("/api/v1/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: titleTrim,
          description: description.trim() || null,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.error?.message ?? t("topicos.toastCreateFail"));
        return;
      }
      const slug = result?.data?.slug as string | undefined;
      toast.success(t("topicos.toastCreateSuccess"));
      setTitle("");
      setDescription("");
      if (slug) router.push(`/t/${slug}`);
      else router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("topicos.createCardTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="topic-title">{t("topicos.createNameLabel")}</Label>
            <Input
              id="topic-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("topicos.createNamePlaceholder")}
              maxLength={120}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="topic-desc">{t("topicos.createDescLabel")}</Label>
            <Textarea
              id="topic-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={t("topicos.createDescPlaceholder")}
            />
          </div>
          <Button type="submit" disabled={pending} className="rounded-xl">
            {pending ? t("topicos.createSubmitPending") : t("topicos.createSubmit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
