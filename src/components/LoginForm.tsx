"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, KeyRound, LogIn, Mail, UserPlus } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const formData = new FormData(event.currentTarget);
    const payload = {
      emailOrUsername: String(formData.get("emailOrUsername") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    };
    startTransition(async () => {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error?.message ?? "Falha ao entrar.");
        return;
      }
      router.push(from || "/");
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-4 w-4 text-emerald-300/90" aria-hidden />
          <span>Entrar</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="from" value={from} />
          <div className="space-y-2">
            <Label htmlFor="emailOrUsername">Email ou username</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/80" aria-hidden />
              <Input
                id="emailOrUsername"
                name="emailOrUsername"
                type="text"
                required
                placeholder="email@exemplo.com"
                className="pl-10"
                autoComplete="username"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/80" aria-hidden />
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="pl-10"
                autoComplete="current-password"
              />
            </div>
          </div>
          {error && (
            <p className="flex items-start gap-2 text-sm leading-6 text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            <ArrowRight className="h-4 w-4" aria-hidden />
            <span>{isPending ? "A entrar..." : "Entrar"}</span>
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-400">
          Sem conta?{" "}
          <Link
            href="/register"
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium tracking-tight text-emerald-300 ring-cyber transition hover:bg-zinc-900/45 hover:text-emerald-200"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            <span>Registar</span>
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
