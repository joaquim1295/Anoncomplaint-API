"use client";

import dynamic from "next/dynamic";
import type { RageMapPoint } from "./RageMap";

const RageMapDynamic = dynamic(
  () => import("./RageMap").then((mod) => mod.RageMap),
  {
    ssr: false,
    loading: () => <div className="h-[70vh] w-full animate-pulse rounded-2xl bg-zinc-900/30" />,
  }
);

export function RageMapNoSSR({ points, className }: { points: RageMapPoint[]; className?: string }) {
  return <RageMapDynamic points={points} className={className} />;
}

