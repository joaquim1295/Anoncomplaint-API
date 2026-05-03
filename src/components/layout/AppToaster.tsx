"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function AppToaster() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = mounted && resolvedTheme === "light" ? "light" : "dark";

  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group relative overflow-hidden rounded-xl backdrop-blur-md shadow-xl ring-1 ring-inset bg-white/90 text-zinc-900 ring-zinc-200/90 dark:bg-zinc-950/75 dark:text-zinc-100 dark:ring-zinc-800/80",
          description: "text-zinc-600 dark:text-zinc-400",
          actionButton:
            "bg-emerald-600/12 text-emerald-900 ring-emerald-600/25 hover:bg-emerald-600/18 dark:bg-emerald-500/14 dark:text-emerald-100 dark:ring-emerald-500/30 dark:hover:bg-emerald-500/18",
          success: "ring-emerald-500/35 dark:ring-emerald-500/30",
          error: "ring-red-500/35 dark:ring-red-500/30",
        },
      }}
    />
  );
}
