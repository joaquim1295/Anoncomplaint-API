"use client";

import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "group relative max-w-full min-w-0 rounded-2xl border border-zinc-200/80 bg-white/90 text-zinc-900 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm transition duration-200 ease-out hover:border-zinc-300/90 hover:shadow-[0_12px_36px_rgba(15,23,42,0.08)] dark:border-transparent dark:bg-zinc-950/55 dark:text-zinc-100 dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-inset dark:ring-zinc-800/80 dark:hover:bg-zinc-950/72 dark:hover:ring-zinc-700/90",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex min-w-0 flex-col gap-1.5 p-5 pb-3", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-base font-semibold leading-6 tracking-tight text-zinc-900 dark:text-zinc-100", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("min-w-0 p-5 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-2 p-5 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
