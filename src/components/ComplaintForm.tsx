"use client";

import { useComplaintForm } from "../hooks/useComplaintForm";
import { AlertTriangle, Building2, Ghost, ImagePlus, Link2, LocateFixed, Send, Tags, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Label } from "./ui/Label";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { uploadComplaintImageDataUri } from "../lib/media/complaint-attachment-upload";
import { useI18n } from "./providers/I18nProvider";

function translateFieldMessage(t: (path: string) => string, msg?: string) {
  if (!msg) return "";
  return msg.startsWith("complaintForm.") ? t(msg) : msg;
}

const CITY_PRESETS: { city: string; lat: number; lng: number }[] = [
  { city: "Lisboa", lat: 38.7223, lng: -9.1393 },
  { city: "Porto", lat: 41.1579, lng: -8.6291 },
  { city: "Coimbra", lat: 40.2033, lng: -8.4103 },
  { city: "Braga", lat: 41.5454, lng: -8.4265 },
  { city: "Aveiro", lat: 40.6405, lng: -8.6538 },
  { city: "Faro", lat: 37.0194, lng: -7.9304 },
  { city: "Setúbal", lat: 38.5244, lng: -8.8882 },
];

type ComplaintFormProps = {
  /** Formulário compacto em grelha (ex.: modal lateral). */
  variant?: "default" | "modal";
  /** Pré-preenche o tópico (ex.: página /t/[slug]); tem prioridade sobre `?topic=` na URL. */
  forcedTopicSlug?: string | null;
};

export function ComplaintForm({ variant = "default", forcedTopicSlug = null }: ComplaintFormProps) {
  const { t } = useI18n();
  const isModal = variant === "modal";
  const searchParams = useSearchParams();
  const { register, handleSubmit, errors, rootError, isPending, setValue, watch } = useComplaintForm();
  const [geoPending, setGeoPending] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [companySuggestions, setCompanySuggestions] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const attachments = watch("attachments") ?? [];

  const currentCity = watch("location_city");
  const lat = watch("location_lat");
  const lng = watch("location_lng");
  const companyId = watch("company_id");

  const cityPreset = useMemo(() => CITY_PRESETS.find((c) => c.city === (currentCity ?? "")) ?? null, [currentCity]);

  useEffect(() => {
    const fromForced = (forcedTopicSlug ?? "").trim().toLowerCase();
    const fromUrl = (searchParams.get("topic") ?? "").trim().toLowerCase();
    const topic = fromForced || fromUrl;
    if (topic && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(topic)) {
      setValue("topic_slug", topic, { shouldValidate: true });
    }
  }, [searchParams, setValue, forcedTopicSlug]);

  useEffect(() => {
    const id = (searchParams.get("complaintCompany") ?? "").trim();
    const name = (searchParams.get("complaintCname") ?? "").trim();
    if (id && /^[a-f0-9]{24}$/i.test(id)) {
      setValue("company_id", id, { shouldValidate: true });
      if (name) setCompanyQuery(name);
    }
  }, [searchParams, setValue]);

  useEffect(() => {
    const q = companyQuery.trim();
    if (!q) {
      setCompanySuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const response = await fetch(`/api/v1/company/public/search?q=${encodeURIComponent(q)}`, {
        credentials: "include",
      });
      const payload = await response.json().catch(() => null);
      const items = Array.isArray(payload?.data) ? payload.data : [];
      setCompanySuggestions(items);
    }, 250);
    return () => clearTimeout(timeout);
  }, [companyQuery]);

  function clearLocation() {
    setValue("location_city", "", { shouldDirty: true, shouldValidate: true });
    setValue("location_lat", undefined, { shouldDirty: true, shouldValidate: true });
    setValue("location_lng", undefined, { shouldDirty: true, shouldValidate: true });
  }

  async function useGeolocation() {
    if (typeof window === "undefined") return;
    if (!("geolocation" in navigator)) return;
    setGeoPending(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          maximumAge: 1000 * 60 * 5,
          timeout: 10_000,
        });
      });
      setValue("location_lat", pos.coords.latitude, { shouldDirty: true, shouldValidate: true });
      setValue("location_lng", pos.coords.longitude, { shouldDirty: true, shouldValidate: true });
      const city = (watch("location_city") ?? "").trim();
      if (!city) setValue("location_city", "GPS", { shouldDirty: true, shouldValidate: true });
    } finally {
      setGeoPending(false);
    }
  }

  async function appendAttachmentFromString(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    let stored = trimmed;
    if (trimmed.startsWith("data:image")) {
      const up = await uploadComplaintImageDataUri(trimmed);
      if (up.status === "ok") {
        stored = up.url;
      } else if (up.status === "error") {
        toast.error(up.message);
        return;
      } else {
        toast.message(t("complaintForm.toastCloudInline"), { duration: 4000 });
      }
    }
    const current = watch("attachments") ?? [];
    setValue("attachments", [...current, stored].slice(0, 4), { shouldDirty: true, shouldValidate: true });
  }

  async function onAttachmentFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error(t("complaintForm.imageProcessError")));
        reader.readAsDataURL(file);
      });
      await appendAttachmentFromString(base64);
    } catch {
      toast.error(t("complaintForm.fileReadError"));
    } finally {
      input.value = "";
    }
  }

  const contentRows = isModal ? 3 : 4;
  const sectionGap = isModal ? "space-y-3" : "space-y-4";
  const cardPad = isModal ? "p-3 sm:p-4" : undefined;

  const formInner = (
    <>
      <div
        className={cn(
          "grid gap-4",
          isModal ? "lg:grid-cols-2 lg:items-start lg:gap-3" : "lg:grid-cols-1"
        )}
      >
        <Card className={cn("border-zinc-200/90 dark:border-zinc-800/80", isModal && "shadow-sm")}>
          <CardHeader className={cn("pb-2", isModal && "px-3 pt-3 sm:px-4 sm:pt-4")}>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <Send className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
              {t("complaintForm.sectionTextAttachments")}
            </CardTitle>
            <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{t("complaintForm.sectionTextAttachmentsHint")}</p>
          </CardHeader>
          <CardContent className={cn(sectionGap, isModal ? "px-3 pb-3 sm:px-4 sm:pb-4" : cardPad)}>
            <div className="space-y-2">
              <Label htmlFor="title">{t("complaintForm.title")}</Label>
              <Input id="title" placeholder={t("complaintForm.titlePlaceholder")} maxLength={100} {...register("title")} />
              {errors.title && (
                <p className="flex items-start gap-2 text-sm leading-6 text-red-600 dark:text-red-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{translateFieldMessage(t, errors.title.message)}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{t("complaintForm.description")}</Label>
              <Textarea
                id="content"
                placeholder={t("complaintForm.descriptionPlaceholder")}
                rows={contentRows}
                className="min-h-0 resize-y"
                {...register("content")}
              />
              {errors.content && (
                <p className="flex items-start gap-2 text-sm leading-6 text-red-600 dark:text-red-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{translateFieldMessage(t, errors.content.message)}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" className="flex items-center gap-2 text-sm">
                <Tags className="h-4 w-4 text-emerald-600 dark:text-emerald-300/80" aria-hidden />
                {t("complaintForm.tags")}
              </Label>
              <Input
                id="tags"
                placeholder={t("complaintForm.tagsPlaceholder")}
                {...register("tags", {
                  setValueAs: (v) => (typeof v === "string" ? v.split(",").map((t) => t.trim()).filter(Boolean) : []),
                })}
              />
              {errors.tags && (
                <p className="flex items-start gap-2 text-sm leading-6 text-red-600 dark:text-red-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{translateFieldMessage(t, errors.tags.message)}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic_slug" className="flex items-center gap-2 text-sm">
                <Tags className="h-4 w-4 text-violet-600 dark:text-violet-300/80" aria-hidden />
                {t("complaintForm.topicOptional")}
              </Label>
              <Input id="topic_slug" placeholder={t("complaintForm.topicPlaceholder")} maxLength={80} {...register("topic_slug")} />
              {errors.topic_slug && (
                <p className="flex items-start gap-2 text-sm leading-6 text-red-600 dark:text-red-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{translateFieldMessage(t, errors.topic_slug.message)}</span>
                </p>
              )}
              <p className="text-[11px] leading-4 text-zinc-500 dark:text-zinc-500">{t("complaintForm.topicHint")}</p>
            </div>

            <div className="space-y-2 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 dark:border-zinc-800/70 dark:bg-zinc-950/30">
              <Label className="flex items-center gap-2 text-sm">
                <ImagePlus className="h-4 w-4 text-emerald-600 dark:text-emerald-300/80" aria-hidden />
                {t("complaintForm.attachmentsLabel")}
              </Label>
              <p className="text-[11px] leading-4 text-zinc-500 dark:text-zinc-500">{t("complaintForm.attachmentsOptional")}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  className="min-w-0 flex-1"
                  value={attachmentUrl}
                  onChange={(event) => setAttachmentUrl(event.target.value)}
                  placeholder={t("complaintForm.imageUrlPlaceholder")}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={async () => {
                    const url = attachmentUrl.trim();
                    if (!url) return;
                    await appendAttachmentFromString(url);
                    setAttachmentUrl("");
                  }}
                >
                  <Link2 className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:inline">{t("complaintForm.addLink")}</span>
                </Button>
              </div>
              <Input type="file" accept="image/*" className="text-xs" onChange={onAttachmentFileChange} />
              {attachments.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                  {attachments.map((item, idx) => (
                    <div
                      key={`${idx}-${item.slice(0, 10)}`}
                      className="relative overflow-hidden rounded-lg ring-1 ring-zinc-300/90 dark:ring-zinc-800/80"
                    >
                      <img src={item} alt="" className="h-14 w-full object-cover sm:h-16" />
                      <button
                        type="button"
                        className="absolute right-0.5 top-0.5 rounded bg-zinc-900/85 px-1 text-[10px] text-white dark:bg-zinc-950/90"
                        onClick={() => {
                          const next = attachments.filter((_, i) => i !== idx);
                          setValue("attachments", next, { shouldDirty: true, shouldValidate: true });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border-zinc-200/90 dark:border-zinc-800/80", isModal && "shadow-sm")}>
          <CardHeader className={cn("pb-2", isModal && "px-3 pt-3 sm:px-4 sm:pt-4")}>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <Building2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
              {t("complaintForm.sectionCompanyLocation")}
            </CardTitle>
            <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{t("complaintForm.sectionCompanyLocationHint")}</p>
          </CardHeader>
          <CardContent className={cn(sectionGap, isModal ? "px-3 pb-3 sm:px-4 sm:pb-4" : cardPad)}>
            <div className="space-y-2">
              <Label htmlFor="company_query" className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300/80" aria-hidden />
                {t("complaintForm.companyOptional")}
              </Label>
              <div className="relative">
                <Input
                  id="company_query"
                  placeholder={t("complaintForm.companySearchPlaceholder")}
                  value={companyQuery}
                  onChange={(event) => {
                    setCompanyQuery(event.target.value);
                    setCompanyOpen(true);
                  }}
                  onFocus={() => setCompanyOpen(true)}
                />
                <input type="hidden" {...register("company_id")} />
                {companyOpen && companySuggestions.length > 0 && (
                  <div className="absolute z-30 mt-1 max-h-40 w-full overflow-auto rounded-xl border border-zinc-200/90 bg-white p-1 shadow-lg dark:border-zinc-800/80 dark:bg-zinc-950/95">
                    {companySuggestions.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900/70"
                        onClick={() => {
                          setValue("company_id", company.id, { shouldDirty: true, shouldValidate: true });
                          setCompanyQuery(company.name);
                          setCompanyOpen(false);
                        }}
                      >
                        <span className="truncate">{company.name}</span>
                        <span className="ml-2 shrink-0 text-xs text-zinc-500">/{company.slug}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {companyId ? (
                <div className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-zinc-50/90 px-2 py-1.5 dark:border-zinc-800/70 dark:bg-zinc-950/25">
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{t("complaintForm.companySelected")}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => {
                      setValue("company_id", undefined, { shouldDirty: true, shouldValidate: true });
                      setCompanyQuery("");
                      setCompanySuggestions([]);
                    }}
                  >
                    Remover
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="space-y-2 rounded-xl border border-zinc-200/80 bg-zinc-50/90 p-3 dark:border-zinc-800/70 dark:bg-zinc-950/25">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{t("complaintForm.whereOccurred")}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Button type="button" size="sm" variant="outline" disabled={isPending || geoPending} onClick={useGeolocation}>
                    <LocateFixed className="h-3.5 w-3.5" aria-hidden />
                    <span className="text-xs">{geoPending ? "…" : t("complaintForm.gps")}</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={isPending}
                    onClick={clearLocation}
                    title={t("complaintForm.clearLocationTitle")}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="location_city" className="text-xs text-zinc-600 dark:text-zinc-400">
                    {t("complaintForm.cityOrEmpty")}
                  </Label>
                  {(() => {
                    const cityReg = register("location_city");
                    return (
                      <select
                        id="location_city"
                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900 ring-cyber transition focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-100"
                        {...cityReg}
                        onChange={(e) => {
                          cityReg.onChange(e);
                          const city = e.target.value;
                          setValue("location_city", city, { shouldDirty: true, shouldValidate: true });
                          if (city === "GPS") return;
                          const preset = CITY_PRESETS.find((c) => c.city === city);
                          if (!preset) {
                            setValue("location_lat", undefined, { shouldDirty: true, shouldValidate: true });
                            setValue("location_lng", undefined, { shouldDirty: true, shouldValidate: true });
                            return;
                          }
                          setValue("location_lat", preset.lat, { shouldDirty: true, shouldValidate: true });
                          setValue("location_lng", preset.lng, { shouldDirty: true, shouldValidate: true });
                        }}
                        suppressHydrationWarning
                      >
                        <option value="">{t("complaintForm.cityOptionDash")}</option>
                        {CITY_PRESETS.map((c) => (
                          <option key={c.city} value={c.city}>
                            {c.city}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                  {errors.location_city && (
                    <p className="flex items-start gap-1.5 text-xs leading-5 text-red-600 dark:text-red-300">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span>{translateFieldMessage(t, errors.location_city.message)}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-600 dark:text-zinc-400">{t("complaintForm.coordinates")}</Label>
                  <div className="rounded-lg border border-zinc-200/80 bg-white/80 px-2 py-1.5 text-xs dark:border-zinc-800/70 dark:bg-zinc-950/40">
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {typeof lat === "number" && typeof lng === "number" ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : t("complaintForm.coordsEmpty")}
                      {cityPreset ? <span className="ml-1 text-zinc-500">{t("complaintForm.coordsPresetCity")}</span> : null}
                    </p>
                  </div>
                  {(errors.location_lat || errors.location_lng) && (
                    <p className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-300">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span>
                        {translateFieldMessage(t, errors.location_lat?.message ?? errors.location_lng?.message)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              {/* Não usar <input type="hidden" valueAsNumber>: com valor vazio o RHF envia NaN e o Zod exige cidade+coords sem feedback óbvio. lat/lng vêm só de setValue (presets / GPS). */}
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/90 px-3 py-2 dark:border-zinc-800/70 dark:bg-zinc-950/20">
              <input
                type="checkbox"
                id="ghost_mode"
                {...register("ghost_mode")}
                className="h-4 w-4 rounded border-zinc-400 text-emerald-600 focus:ring-emerald-500/40 dark:border-zinc-600 dark:bg-zinc-900"
                suppressHydrationWarning
              />
              <Label htmlFor="ghost_mode" className="flex cursor-pointer items-center gap-2 text-sm font-normal text-zinc-700 dark:text-zinc-300">
                <Ghost className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
                {t("complaintForm.ghostMode")}
              </Label>
            </div>

            {rootError && (
              <p className="flex items-start gap-2 rounded-lg border border-red-200/80 bg-red-50/80 px-2 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{translateFieldMessage(t, rootError)}</span>
              </p>
            )}

            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              <Send className="h-4 w-4" aria-hidden />
              <span>{isPending ? t("complaintForm.submitSending") : t("complaintForm.submitComplaint")}</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );

  if (isModal) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        {formInner}
      </form>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
          <span>{t("complaintForm.cardTitle")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formInner}
        </form>
      </CardContent>
    </Card>
  );
}
