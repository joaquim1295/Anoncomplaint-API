"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { SwaggerUIBlock } from "../../components/api/SwaggerUI";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/70 pb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-200 ring-cyber transition hover:bg-zinc-900/45 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-300/90" aria-hidden />
            <span>AnonComplaint</span>
          </Link>
          <h1 className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-100">
            <FileText className="h-4 w-4 text-emerald-300/90" aria-hidden />
            <span>API Docs</span>
          </h1>
        </header>

        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/30 p-6">
            <p className="text-sm leading-6 text-zinc-300">
              OpenAPI disponível em{" "}
              <a
                href="/api/v1/openapi"
                className="text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
              >
                /api/v1/openapi
              </a>
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Endpoint inicial de saúde: /api/v1/health
            </p>
          </div>
          <SwaggerUIBlock />
        </div>
      </div>
    </div>
  );
}

