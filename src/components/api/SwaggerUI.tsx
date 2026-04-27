"use client";

import SwaggerUI from "swagger-ui-react";

export function SwaggerUIBlock() {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-white p-2">
      <SwaggerUI url="/api/v1/openapi" />
    </div>
  );
}

