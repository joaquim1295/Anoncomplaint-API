"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => <div className="min-h-[400px] animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900/50" aria-hidden />,
});

export function SwaggerUIBlock() {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-white p-2">
      <SwaggerUI url="/api/v1/openapi" />
    </div>
  );
}

