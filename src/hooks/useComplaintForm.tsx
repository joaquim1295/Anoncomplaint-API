"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createComplaintSchema, type CreateComplaintInput } from "../lib/validations";
import { useI18n } from "../components/providers/I18nProvider";

function translateIfKey(t: (path: string) => string, msg: string) {
  return msg.startsWith("complaintForm.") ? t(msg) : msg;
}

function collectFieldErrorMessages(
  t: (path: string) => string,
  errors: FieldErrors<CreateComplaintInput>
): string[] {
  const out: string[] = [];
  function walk(node: unknown, path: string): void {
    if (node == null || typeof node !== "object") return;
    const rec = node as Record<string, unknown>;
    if (typeof rec.message === "string" && rec.message) {
      out.push(`${path || "form"}: ${translateIfKey(t, rec.message)}`);
      return;
    }
    for (const [k, v] of Object.entries(rec)) {
      if (k === "ref" || k === "type" || k === "root") continue;
      walk(v, path ? `${path}.${k}` : k);
    }
  }
  walk(errors, "");
  if (errors.root?.message) {
    out.unshift(`root: ${translateIfKey(t, String(errors.root.message))}`);
  }
  return out;
}

export function useComplaintForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<CreateComplaintInput>({
    resolver: zodResolver(createComplaintSchema),
    defaultValues: {
      title: "",
      company_id: undefined,
      content: "",
      attachments: [],
      tags: [],
      ghost_mode: true,
      location_city: "",
      location_lat: undefined,
      location_lng: undefined,
      topic_slug: "",
    },
  });

  const onSubmit = form.handleSubmit(
    (values) => {
    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("content", values.content);
    if (values.company_id) formData.set("company_id", values.company_id);
    formData.set("tags", values.tags.join(","));
    formData.set("ghost_mode", String(values.ghost_mode));
    startTransition(async () => {
      const topicRaw = (values.topic_slug ?? "").trim();
      const locCity = (values.location_city ?? "").trim();
      const locLat =
        typeof values.location_lat === "number" && !Number.isNaN(values.location_lat)
          ? values.location_lat
          : undefined;
      const locLng =
        typeof values.location_lng === "number" && !Number.isNaN(values.location_lng)
          ? values.location_lng
          : undefined;
      const payload = {
        title: String(formData.get("title") ?? "").trim(),
        company_id: String(formData.get("company_id") ?? "").trim() || undefined,
        content: String(formData.get("content") ?? ""),
        attachments: values.attachments ?? [],
        tags: String(formData.get("tags") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        ghost_mode: String(formData.get("ghost_mode") ?? "true") === "true",
        location_city: locCity || undefined,
        location_lat: locLat,
        location_lng: locLng,
        ...(topicRaw ? { topic_slug: topicRaw.replace(/^#/, "").toLowerCase() } : {}),
      };
      const response = await fetch("/api/v1/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const raw = result?.error?.message ?? "complaintForm.toastCreateFailed";
        const msg = translateIfKey(t, raw);
        const details = result?.error?.details;
        const detailStr =
          details == null ? "" : typeof details === "string" ? ` ${details}` : ` ${JSON.stringify(details)}`;
        const full = msg + detailStr;
        form.setError("root", { message: full });
        toast.error(full);
      } else {
        const flagged = Boolean(result?.data?.flagged);
        form.reset();
        if (flagged) {
          toast.warning(t("complaintForm.toastModerationPending"));
        } else {
          toast.success(t("complaintForm.toastCreateSuccess"));
        }
        router.refresh();
      }
    });
    },
    (errors) => {
      const msgs = collectFieldErrorMessages(t, errors);
      const root = errors.root?.message ? translateIfKey(t, String(errors.root.message)) : null;
      const text =
        msgs.length > 0 ? msgs.join(" | ") : root ?? t("complaintForm.validation.invalidPayload");
      toast.error(text);
    }
  );

  return {
    register: form.register,
    control: form.control,
    handleSubmit: onSubmit,
    errors: form.formState.errors,
    rootError: form.formState.errors.root?.message,
    isPending,
    setValue: form.setValue,
    watch: form.watch,
  };
}
