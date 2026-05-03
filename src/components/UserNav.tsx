"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, ChevronDown, Inbox, LogIn, LogOut, UserCircle2, UserPlus } from "lucide-react";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";
import { useI18n } from "./providers/I18nProvider";

interface UserNavProps {
  userId: string | null;
  userEmail?: string | null;
}

export function UserNav({ userId, userEmail }: UserNavProps) {
  const router = useRouter();
  const { t } = useI18n();

  async function onLogout() {
    await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
    router.refresh();
  }

  if (!userId) {
    return (
      <nav className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            <LogIn className="h-4 w-4 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
            <span>{t("userNav.signIn")}</span>
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm">
            <UserPlus className="h-4 w-4 text-emerald-800 dark:text-emerald-300/90" aria-hidden />
            <span>{t("userNav.register")}</span>
          </Button>
        </Link>
      </nav>
    );
  }

  return (
    <nav className="relative flex items-center gap-2">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-xl px-3"
            aria-label={t("userNav.accountMenu")}
          >
            <UserCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
            {userEmail && (
              <span
                className="max-w-[140px] truncate text-sm font-medium tracking-tight text-zinc-800 dark:text-zinc-200"
                title={userEmail}
              >
                {userEmail}
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-zinc-500 dark:text-zinc-400" aria-hidden />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className={cn(
              "z-50 min-w-[200px] overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/95 p-1 shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90",
              "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95"
            )}
          >
            <DropdownMenu.Item asChild>
              <Link
                href="/perfil"
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium tracking-tight text-zinc-800 outline-none hover:bg-zinc-100 hover:text-zinc-950 focus:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900/55 dark:hover:text-zinc-100"
              >
                <UserCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
                <span>{t("userNav.profile")}</span>
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href="/notificacoes"
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium tracking-tight text-zinc-800 outline-none hover:bg-zinc-100 hover:text-zinc-950 focus:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900/55 dark:hover:text-zinc-100"
              >
                <Bell className="h-4 w-4 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
                <span>{t("userNav.notifications")}</span>
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href="/inbox"
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium tracking-tight text-zinc-800 outline-none hover:bg-zinc-100 hover:text-zinc-950 focus:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900/55 dark:hover:text-zinc-100"
              >
                <Inbox className="h-4 w-4 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
                <span>{t("userNav.inbox")}</span>
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium tracking-tight text-zinc-800 outline-none hover:bg-red-50 hover:text-red-900 focus:bg-red-50 dark:text-zinc-200 dark:hover:bg-zinc-900/55 dark:hover:text-zinc-100"
              onSelect={(e) => {
                e.preventDefault();
                void onLogout();
              }}
            >
              <LogOut className="h-4 w-4 text-red-600 dark:text-red-300/90" aria-hidden />
              <span>{t("userNav.signOut")}</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </nav>
  );
}
