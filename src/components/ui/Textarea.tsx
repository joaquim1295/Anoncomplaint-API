"use client";

import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[96px] w-full resize-y rounded-xl border border-zinc-200/90 bg-white/90 px-3 py-2 text-sm leading-6 text-zinc-900 placeholder:text-zinc-500 ring-cyber transition duration-200 ease-out hover:border-zinc-300 focus-visible:border-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800/80 dark:bg-zinc-950/30 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-700/80",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
