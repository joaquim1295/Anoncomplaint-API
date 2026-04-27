"use client";

import { useState, useEffect } from "react";

export function HydrationSafe({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="min-h-screen" aria-hidden />;
  }

  return <>{children}</>;
}
