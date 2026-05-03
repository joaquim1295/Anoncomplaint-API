"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Building2, KeyRound, LogIn, Mail, User2, UserPlus } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { useI18n } from "./providers/I18nProvider";

export function RegisterForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);
  const [registerAsCompany, setRegisterAsCompany] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? "").trim(),
      username: String(formData.get("username") ?? "").trim() || undefined,
      password: String(formData.get("password") ?? ""),
      register_as_company: String(formData.get("register_as_company") ?? "") === "on",
      company_name: String(formData.get("company_name") ?? "").trim() || undefined,
      company_website: String(formData.get("company_website") ?? "").trim() || undefined,
      company_contact_name: String(formData.get("company_contact_name") ?? "").trim() || undefined,
    };
    startTransition(async () => {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error?.message ?? t("auth.registerError"));
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-emerald-300/90" aria-hidden />
          <span>{t("auth.register")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/80" aria-hidden />
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="email@exemplo.com"
                className="pl-10"
                autoComplete="email"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">{t("auth.usernameOptional")}</Label>
            <div className="relative">
              <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/80" aria-hidden />
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="nome_utilizador"
                className="pl-10"
                autoComplete="nickname"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.passwordMin")}</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/80" aria-hidden />
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                className="pl-10"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="register_as_company"
              name="register_as_company"
              checked={registerAsCompany}
              onChange={(event) => setRegisterAsCompany(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-950/30 text-emerald-500 ring-cyber"
            />
            <Label htmlFor="register_as_company" className="flex items-center gap-2 font-normal text-zinc-300">
              <Building2 className="h-4 w-4 text-emerald-300/90" aria-hidden />
              <span>{t("auth.registerAsCompany")}</span>
            </Label>
          </div>
          {registerAsCompany && (
            <div className="space-y-3 rounded-xl bg-zinc-950/25 p-3 ring-1 ring-inset ring-zinc-800/70">
              <div className="space-y-2">
                <Label htmlFor="company_name">{t("auth.companyName")}</Label>
                <Input id="company_name" name="company_name" required placeholder={t("auth.companyNamePh")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_website">{t("auth.officialWebsite")}</Label>
                <Input id="company_website" name="company_website" required placeholder="https://company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_contact_name">{t("auth.contactName")}</Label>
                <Input id="company_contact_name" name="company_contact_name" required placeholder={t("auth.contactNamePh")} />
              </div>
              <p className="text-xs text-zinc-400">
                {t("auth.companyNote")}
              </p>
            </div>
          )}
          {error && (
            <p className="flex items-start gap-2 text-sm leading-6 text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            <ArrowRight className="h-4 w-4" aria-hidden />
            <span>{isPending ? t("auth.registering") : t("auth.register")}</span>
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-400">
          {t("auth.haveAccount")}{" "}
          <Link
            href="/login"
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium tracking-tight text-emerald-300 ring-cyber transition hover:bg-zinc-900/45 hover:text-emerald-200"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            <span>{t("auth.signIn")}</span>
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
