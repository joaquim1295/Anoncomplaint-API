"use client";

import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[96px] w-full resize-y rounded-md bg-zinc-950/30 px-3 py-2 text-sm leading-6 text-zinc-100 placeholder:text-zinc-500 ring-1 ring-inset ring-zinc-800/70 ring-cyber transition duration-200 ease-out hover:ring-zinc-700/80 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
