"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 rounded-md text-sm font-medium tracking-tight ring-cyber transition duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 active:translate-y-[1px]",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-500/15 text-emerald-200 ring-1 ring-inset ring-emerald-500/30 shadow-glow-emerald hover:bg-emerald-500/18 hover:text-emerald-100 hover:ring-emerald-400/50",
        secondary:
          "bg-zinc-900/40 text-zinc-200 ring-1 ring-inset ring-zinc-800/70 hover:bg-zinc-900/60 hover:text-zinc-100",
        outline:
          "bg-transparent text-zinc-200 ring-1 ring-inset ring-zinc-700/70 hover:bg-zinc-900/35 hover:ring-emerald-500/35",
        ghost:
          "bg-transparent text-zinc-200 hover:bg-zinc-900/45 hover:text-zinc-100",
        destructive:
          "bg-red-500/14 text-red-100 ring-1 ring-inset ring-red-500/30 shadow-glow-red hover:bg-red-500/18 hover:ring-red-400/45",
        link:
          "bg-transparent text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline",
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
