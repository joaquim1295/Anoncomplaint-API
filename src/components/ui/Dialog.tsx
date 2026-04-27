"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface DialogContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within Dialog");
  return ctx;
}

function Dialog({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (v: boolean) => {
      if (!isControlled) setInternalOpen(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange]
  );
  return (
    <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>
  );
}

function DialogTrigger({
  children,
  asChild,
  className,
}: {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  const { setOpen } = useDialog();
  if (asChild && React.isValidElement(children)) {
    return (
      <span className={className} onClick={() => setOpen(true)}>
        {children}
      </span>
    );
  }
  return (
    <button type="button" className={className} onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, setOpen } = useDialog();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = contentRef.current;
    el?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
        aria-hidden
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        ref={contentRef}
        className={cn(
          "relative z-50 max-h-[90vh] w-full max-w-lg rounded-2xl bg-zinc-950/65 p-6 text-zinc-100 ring-1 ring-inset ring-zinc-800/80 shadow-2xl backdrop-blur animate-in slide-in-from-bottom-2 focus:outline-none",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col space-y-1.5", className)}>{children}</div>;
}

function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-base font-semibold leading-6 tracking-tight text-zinc-100", className)}>
      {children}
    </h2>
  );
}

function DialogClose({ children, className }: { children: React.ReactNode; className?: string }) {
  const { setOpen } = useDialog();
  return (
    <button type="button" className={className} onClick={() => setOpen(false)}>
      {children}
    </button>
  );
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose };
