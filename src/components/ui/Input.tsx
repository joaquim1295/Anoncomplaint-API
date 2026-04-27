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
        "flex h-10 w-full rounded-md bg-zinc-950/30 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 ring-1 ring-inset ring-zinc-800/70 ring-cyber transition duration-200 ease-out hover:ring-zinc-700/80 focus-visible:ring-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
