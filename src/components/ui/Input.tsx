"use client";

import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      suppressHydrationWarning
      className={cn(
        "flex h-10 w-full rounded-xl border border-zinc-200/90 bg-white/90 px-3 text-sm text-zinc-900 placeholder:text-zinc-500 ring-cyber transition duration-200 ease-out hover:border-zinc-300 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800/80 dark:bg-zinc-950/30 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-700/80 dark:focus-visible:ring-emerald-400/40",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
