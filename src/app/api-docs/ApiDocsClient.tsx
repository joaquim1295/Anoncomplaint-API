"use client";

import { SwaggerUIBlock } from "../../components/api/SwaggerUI";

export function ApiDocsClient() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/90 p-6 dark:border-zinc-800/80 dark:bg-zinc-950/30">
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          OpenAPI disponível em{" "}
          <a
            href="/api/v1/openapi"
            className="text-emerald-700 underline underline-offset-4 hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200"
          >
            /api/v1/openapi
          </a>
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-500">
          Endpoint inicial de saúde: /api/v1/health
        </p>
      </div>
      <SwaggerUIBlock />
    </div>
  );
}
