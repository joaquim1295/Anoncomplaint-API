"use client";

import { useComplaintForm } from "../hooks/useComplaintForm";
import { AlertTriangle, Ghost, LocateFixed, MapPin, Send, Tags, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Label } from "./ui/Label";
import { useMemo, useState } from "react";

const CITY_PRESETS: { city: string; lat: number; lng: number }[] = [
  { city: "Lisboa", lat: 38.7223, lng: -9.1393 },
  { city: "Porto", lat: 41.1579, lng: -8.6291 },
  { city: "Coimbra", lat: 40.2033, lng: -8.4103 },
  { city: "Braga", lat: 41.5454, lng: -8.4265 },
  { city: "Aveiro", lat: 40.6405, lng: -8.6538 },
  { city: "Faro", lat: 37.0194, lng: -7.9304 },
  { city: "Setúbal", lat: 38.5244, lng: -8.8882 },
];

export function ComplaintForm() {
  const { register, handleSubmit, errors, rootError, isPending, setValue, watch } = useComplaintForm();
  const [geoPending, setGeoPending] = useState(false);

  const currentCity = watch("location_city");
  const lat = watch("location_lat");
  const lng = watch("location_lng");

  const cityPreset = useMemo(() => CITY_PRESETS.find((c) => c.city === (currentCity ?? "")) ?? null, [currentCity]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-4 w-4 text-emerald-300/90" aria-hidden />
          <span>Nova denúncia</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              placeholder="Descreva a sua denúncia (mín. 10 caracteres)..."
              rows={4}
              {...register("content")}
            />
            {errors.content && (
              <p className="flex items-start gap-2 text-sm leading-6 text-red-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{errors.content.message}</span>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-emerald-300/80" aria-hidden />
              <span>Tags (separadas por vírgula)</span>
            </Label>
            <Input
              id="tags"
              placeholder="ex: transporte, atraso, limpeza"
              {...register("tags", { setValueAs: (v) => (typeof v === "string" ? v.split(",").map((t) => t.trim()).filter(Boolean) : []) })}
            />
            {errors.tags && (
              <p className="flex items-start gap-2 text-sm leading-6 text-red-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{errors.tags.message}</span>
              </p>
            )}
          </div>

          <div className="space-y-2 rounded-2xl bg-zinc-950/20 p-4 ring-1 ring-inset ring-zinc-800/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Label htmlFor="location_city" className="flex items-center gap-2 text-zinc-200">
                <MapPin className="h-4 w-4 text-red-300/90" aria-hidden />
                <span>Localização (opcional)</span>
              </Label>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" disabled={isPending || geoPending} onClick={useGeolocation}>
                  <LocateFixed className="h-4 w-4" aria-hidden />
                  <span>{geoPending ? "A obter..." : "Usar GPS"}</span>
                </Button>
                <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={clearLocation}>
                  <X className="h-4 w-4" aria-hidden />
                  <span>Limpar</span>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location_city" className="text-sm text-zinc-300">
                  Cidade
                </Label>
                {(() => {
                  const cityReg = register("location_city");
                  return (
                <select
                  id="location_city"
                  className="flex h-10 w-full rounded-md bg-zinc-950/30 px-3 text-sm text-zinc-100 ring-1 ring-inset ring-zinc-800/70 ring-cyber transition duration-200 ease-out hover:ring-zinc-700/80 focus-visible:ring-emerald-400/60"
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
                  <option value="">Sem localização</option>
                  {CITY_PRESETS.map((c) => (
                    <option key={c.city} value={c.city}>
                      {c.city}
                    </option>
                  ))}
                </select>
                  );
                })()}
                {errors.location_city && (
                  <p className="flex items-start gap-2 text-sm leading-6 text-red-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>{errors.location_city.message}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-zinc-300">Coordenadas</Label>
                <div className="rounded-xl bg-zinc-950/25 px-3 py-2 ring-1 ring-inset ring-zinc-800/70">
                  <p className="text-xs leading-6 text-zinc-400">
                    {typeof lat === "number" && typeof lng === "number" ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "-"}
                    {cityPreset ? <span className="ml-2 text-zinc-500">(centro da cidade)</span> : null}
                  </p>
                </div>
                {(errors.location_lat || errors.location_lng) && (
                  <p className="flex items-start gap-2 text-sm leading-6 text-red-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>{errors.location_lat?.message ?? errors.location_lng?.message}</span>
                  </p>
                )}
              </div>
            </div>

            <input type="hidden" {...register("location_lat", { valueAsNumber: true })} />
            <input type="hidden" {...register("location_lng", { valueAsNumber: true })} />
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-zinc-950/20 px-3 py-2 ring-1 ring-inset ring-zinc-800/70">
            <input
              type="checkbox"
              id="ghost_mode"
              {...register("ghost_mode")}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-950/30 text-emerald-500 ring-cyber"
              suppressHydrationWarning
            />
            <Label htmlFor="ghost_mode" className="flex items-center gap-2 font-normal text-zinc-300">
              <Ghost className="h-4 w-4 text-emerald-300/90" aria-hidden />
              <span>Modo Fantasma (anonimato do autor)</span>
            </Label>
          </div>
          {rootError && (
            <p className="flex items-start gap-2 text-sm leading-6 text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{rootError}</span>
            </p>
          )}
          <Button type="submit" disabled={isPending}>
            <Send className="h-4 w-4" aria-hidden />
            <span>{isPending ? "A enviar..." : "Enviar denúncia"}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
