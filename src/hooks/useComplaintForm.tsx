"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createComplaintSchema, type CreateComplaintInput } from "../lib/validations";

export function useComplaintForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<CreateComplaintInput>({
    resolver: zodResolver(createComplaintSchema),
    defaultValues: {
      content: "",
      tags: [],
      ghost_mode: true,
      location_city: "",
      location_lat: undefined,
      location_lng: undefined,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.set("content", values.content);
    formData.set("tags", values.tags.join(","));
    formData.set("ghost_mode", String(values.ghost_mode));
    const city = (values.location_city ?? "").trim();
    if (city && typeof values.location_lat === "number" && typeof values.location_lng === "number") {
      formData.set("location_city", city);
      formData.set("location_lat", String(values.location_lat));
      formData.set("location_lng", String(values.location_lng));
    }
    startTransition(async () => {
      const payload = {
        content: String(formData.get("content") ?? ""),
        tags: String(formData.get("tags") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        ghost_mode: String(formData.get("ghost_mode") ?? "true") === "true",
        location_city: String(formData.get("location_city") ?? "").trim() || undefined,
        location_lat: formData.get("location_lat") ? Number(formData.get("location_lat")) : undefined,
        location_lng: formData.get("location_lng") ? Number(formData.get("location_lng")) : undefined,
      };
      const response = await fetch("/api/v1/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        form.setError("root", { message: result?.error?.message ?? "Não foi possível criar a denúncia." });
      } else {
        const flagged = Boolean(result?.data?.flagged);
        form.reset();
        if (flagged) {
          toast.warning("A denúncia foi enviada e está em revisão. Será publicada após moderação.");
        }
      }
    });
  });

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
