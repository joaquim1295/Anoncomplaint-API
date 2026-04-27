"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogIn, LogOut, UserCircle2, UserPlus } from "lucide-react";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";

interface UserNavProps {
  userId: string | null;
  userEmail?: string | null;
}

export function UserNav({ userId, userEmail }: UserNavProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  async function onLogout() {
    await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }


  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  if (!userId) {
    return (
      <nav className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            <LogIn className="h-4 w-4 text-emerald-300/90" aria-hidden />
            <span>Entrar</span>
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm">
            <UserPlus className="h-4 w-4 text-emerald-300/90" aria-hidden />
            <span>Registar</span>
          </Button>
        </Link>
      </nav>
    );
  }

  return (
    <nav className="relative flex items-center gap-2" ref={ref}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        className="h-10 rounded-xl px-3"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <UserCircle2 className="h-5 w-5 text-emerald-300/90" aria-hidden />
        {userEmail && (
          <span
            className="max-w-[140px] truncate text-sm font-medium tracking-tight text-zinc-200"
            title={userEmail}
          >
            {userEmail}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-zinc-400 transition duration-200",
            open ? "rotate-180 text-emerald-200" : "rotate-0"
          )}
          aria-hidden
        />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-2xl bg-zinc-950/70 ring-1 ring-inset ring-zinc-800/80 shadow-2xl backdrop-blur animate-in slide-in-from-bottom-2"
          role="menu"
        >
          <Link
            href="/notificacoes"
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium tracking-tight text-zinc-200 transition hover:bg-zinc-900/55 hover:text-zinc-100 focus-visible:outline-none"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Bell className="h-4 w-4 text-emerald-300/90" aria-hidden />
            <span>Notificações</span>
          </Link>
          <Link
            href="/perfil"
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium tracking-tight text-zinc-200 transition hover:bg-zinc-900/55 hover:text-zinc-100 focus-visible:outline-none"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <UserCircle2 className="h-4 w-4 text-emerald-300/90" aria-hidden />
            <span>Perfil</span>
          </Link>
          <button
              type="button"
              onClick={onLogout}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium tracking-tight text-zinc-200 transition hover:bg-zinc-900/55 hover:text-zinc-100"
              )}
              role="menuitem"
            >
              <LogOut className="h-4 w-4 text-red-300/90" aria-hidden />
              <span>Sair</span>
            </button>
        </div>
      )}
    </nav>
  );
}
