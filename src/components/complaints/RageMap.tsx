"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { cn } from "../../lib/utils";

export type RageMapPoint = {
  id: string;
  lat: number;
  lng: number;
  city: string;
  intensity?: number;
};

function HeatLayer({ points }: { points: RageMapPoint[] }) {
  const map = useMap();

  const heatPoints = useMemo(() => {
    return points.map((p) => [p.lat, p.lng, typeof p.intensity === "number" ? p.intensity : 0.65]);
  }, [points]);

  useEffect(() => {
    const heatLayer = (L as unknown as { heatLayer: (pts: unknown[], opts: unknown) => { addTo: (m: unknown) => void; remove: () => void } }).heatLayer(
      heatPoints,
      {
        radius: 26,
        blur: 20,
        maxZoom: 12,
        minOpacity: 0.25,
        gradient: {
          0.35: "#fca5a5",
          0.55: "#f87171",
          0.75: "#ef4444",
          1.0: "#b91c1c",
        },
      }
    );
    heatLayer.addTo(map);
    return () => {
      heatLayer.remove();
    };
  }, [map, heatPoints]);

  return null;
}

export function RageMap({
  points,
  className,
}: {
  points: RageMapPoint[];
  className?: string;
}) {
  const [isDark, setIsDark] = useState(false);
  const center = useMemo<[number, number]>(() => {
    if (!points.length) return [39.3999, -8.2245];
    const avgLat = points.reduce((acc, p) => acc + p.lat, 0) / points.length;
    const avgLng = points.reduce((acc, p) => acc + p.lng, 0) / points.length;
    return [avgLat, avgLng];
  }, [points]);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => {
      setIsDark(root.classList.contains("dark") || (!root.classList.contains("light") && media.matches));
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    media.addEventListener("change", syncTheme);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", syncTheme);
    };
  }, []);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-zinc-50/90 ring-1 ring-inset ring-zinc-200/90 dark:bg-zinc-950/20 dark:ring-zinc-800/70",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200/90 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800/70 dark:bg-zinc-950/25">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          <span className="h-2 w-2 rounded-full bg-red-500 dark:bg-red-400 dark:shadow-glow-red" aria-hidden />
          <span>Rage Map</span>
        </div>
        <p className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">{points.length} pontos</p>
      </div>
      <div className="h-[70vh] min-h-[420px] w-full">
        <MapContainer
          center={center}
          zoom={6}
          minZoom={3}
          scrollWheelZoom
          className="h-full w-full"
          attributionControl={false}
        >
          <TileLayer
            url={
              isDark
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
            subdomains={["a", "b", "c", "d"]}
          />
          {points.length > 0 ? <HeatLayer points={points} /> : null}
        </MapContainer>
      </div>
    </div>
  );
}
