"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 rounded-xl text-sm font-medium tracking-tight ring-cyber transition duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-600/[0.1] text-emerald-900 ring-1 ring-inset ring-emerald-600/25 shadow-sm hover:bg-emerald-600/[0.14] hover:ring-emerald-600/35 dark:bg-emerald-500/15 dark:text-emerald-200 dark:shadow-glow-emerald dark:ring-emerald-500/30 dark:hover:bg-emerald-500/18 dark:hover:text-emerald-100 dark:hover:ring-emerald-400/50",
        secondary:
          "bg-zinc-100 text-zinc-800 ring-1 ring-inset ring-zinc-300/80 hover:bg-zinc-200/90 hover:text-zinc-950 dark:bg-zinc-900/40 dark:text-zinc-200 dark:ring-zinc-800/70 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-100",
        outline:
          "bg-transparent text-zinc-800 ring-1 ring-inset ring-zinc-300/90 hover:bg-zinc-100/90 hover:ring-emerald-600/30 dark:text-zinc-200 dark:ring-zinc-700/70 dark:hover:bg-zinc-900/35 dark:hover:ring-emerald-500/35",
        ghost:
          "bg-transparent text-zinc-700 hover:bg-zinc-200/80 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900/45 dark:hover:text-zinc-100",
        destructive:
          "bg-red-600/[0.08] text-red-800 ring-1 ring-inset ring-red-600/25 hover:bg-red-600/[0.12] dark:bg-red-500/14 dark:text-red-100 dark:shadow-glow-red dark:ring-red-500/30 dark:hover:bg-red-500/18 dark:hover:ring-red-400/45",
        link:
          "bg-transparent text-emerald-700 underline-offset-4 hover:text-emerald-900 hover:underline dark:text-emerald-300 dark:hover:text-emerald-200",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-6 text-sm",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      suppressHydrationWarning
      className={cn("group", buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
