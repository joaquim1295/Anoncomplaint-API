import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "../../components/LoginForm";
import { ThemeToggle } from "../../components/theme/ThemeToggle";
import { ArrowLeft } from "lucide-react";
import { getI18n } from "../../lib/i18n/request";
import { getMessage } from "../../lib/i18n/dict";

export const metadata: Metadata = {
  title: "Iniciar sessão",
  description: "Entre na sua conta SmartComplaint.",
};

export default async function LoginPage() {
  const { messages } = await getI18n();
  const back = getMessage(messages, "common.backHome");
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4 z-10 md:right-8 md:top-8">
        <Suspense fallback={null}>
          <ThemeToggle compact />
        </Suspense>
      </div>
      <Suspense fallback={<div className="h-10 w-72 animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-900/40" />}>
        <LoginForm />
      </Suspense>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-600 ring-cyber transition hover:bg-zinc-200/80 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900/45 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4 text-emerald-700 dark:text-emerald-300/90" aria-hidden />
        <span>{back}</span>
      </Link>
    </div>
  );
}
