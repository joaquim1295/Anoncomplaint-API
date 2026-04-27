"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Building2, CheckCircle2, KeyRound, Save, Trash2, User2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { cn } from "../../lib/utils";
import { UserRole } from "../../types/user";

type User = { userId: string; email: string; username?: string; role: string };

type Company = {
  id: string;
  name: string;
  website?: string | null;
  description?: string | null;
  created_at: string | Date;
};

export function PerfilView({ user, companies }: { user: User; companies: Company[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [usernameError, setUsernameError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [roleError, setRoleError] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState(user.username ?? "");
  const [successUsername, setSuccessUsername] = useState(false);
  const [successPassword, setSuccessPassword] = useState(false);
  const isCompany = user.role === UserRole.COMPANY;
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyWebsite, setNewCompanyWebsite] = useState("");
  const [newCompanyDescription, setNewCompanyDescription] = useState("");

  useEffect(() => {
    setUsername(user.username ?? "");
  }, [user.username]);

  async function onSubmitUsername(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUsernameError(undefined);
    setSuccessUsername(false);
    startTransition(async () => {
      const response = await fetch("/api/v1/users/me/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setUsernameError(result?.error?.message ?? "Não foi possível atualizar username.");
        return;
      }
      setSuccessUsername(true);
      router.refresh();
    });
  }

  async function onSubmitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setPasswordError(undefined);
    setSuccessPassword(false);
    const formData = new FormData(formElement);
    const payload = {
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };
    startTransition(async () => {
      const response = await fetch("/api/v1/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setPasswordError(result?.error?.message ?? "Não foi possível atualizar password.");
        return;
      }
      setSuccessPassword(true);
      formElement.reset();
    });
  }

  function onActivateCompanyRole() {
    setRoleError(undefined);
    startTransition(async () => {
      const response = await fetch("/api/v1/users/me/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: UserRole.COMPANY }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setRoleError(result?.error?.message ?? "Não foi possível ativar perfil de empresa.");
        return;
      }
      router.refresh();
    });
  }

  function onCreateCompany(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const response = await fetch("/api/v1/company/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newCompanyName,
          website: newCompanyWebsite || undefined,
          description: newCompanyDescription || undefined,
        }),
      });
      if (response.ok) {
        setNewCompanyName("");
        setNewCompanyWebsite("");
        setNewCompanyDescription("");
        router.refresh();
      }
    });
  }

  function onUpdateCompany(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const response = await fetch(`/api/v1/company/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          website: String(formData.get("website") ?? "") || undefined,
          description: String(formData.get("description") ?? "") || undefined,
        }),
      });
      if (response.ok) router.refresh();
    });
  }

  function onDeleteCompany(id: string) {
    startTransition(async () => {
      const response = await fetch(`/api/v1/company/companies/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) router.refresh();
    });
  }

  return (
    <Tabs.Root defaultValue="dados" className="w-full max-w-xl">
      <Tabs.List className="mb-6 flex flex-wrap gap-2 border-b border-zinc-800/70 pb-3">
        <Tabs.Trigger
          value="dados"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight ring-cyber transition",
            "data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-200 data-[state=active]:ring-emerald-500/25",
            "data-[state=inactive]:text-zinc-400 hover:bg-zinc-900/45 hover:text-zinc-100"
          )}
        >
          <User2 className="h-4 w-4 text-emerald-300/90" aria-hidden />
          <span>Dados</span>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="seguranca"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight ring-cyber transition",
            "data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-200 data-[state=active]:ring-emerald-500/25",
            "data-[state=inactive]:text-zinc-400 hover:bg-zinc-900/45 hover:text-zinc-100"
          )}
        >
          <KeyRound className="h-4 w-4 text-emerald-300/90" aria-hidden />
          <span>Segurança</span>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="empresa"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight ring-cyber transition",
            "data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-200 data-[state=active]:ring-emerald-500/25",
            "data-[state=inactive]:text-zinc-400 hover:bg-zinc-900/45 hover:text-zinc-100"
          )}
        >
          <Building2 className="h-4 w-4 text-emerald-300/90" aria-hidden />
          <span>Empresa</span>
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="dados" className="space-y-4">
        <p className="text-sm leading-6 text-zinc-400">Email: {user.email}</p>
        <form onSubmit={onSubmitUsername} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nome de utilizador"
              className="max-w-xs"
            />
          </div>
          {usernameError && (
            <p className="flex items-start gap-2 text-sm leading-6 text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{usernameError}</span>
            </p>
          )}
          {successUsername && (
            <p className="flex items-center gap-2 text-sm leading-6 text-emerald-200">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              <span>Username atualizado.</span>
            </p>
          )}
          <Button type="submit" disabled={isPending}>
            <Save className="h-4 w-4" aria-hidden />
            <span>Guardar username</span>
          </Button>
        </form>
      </Tabs.Content>
      <Tabs.Content value="seguranca" className="space-y-4">
        <form onSubmit={onSubmitPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Password atual</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="max-w-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="max-w-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nova password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="max-w-xs"
            />
          </div>
          {passwordError && (
            <p className="flex items-start gap-2 text-sm leading-6 text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{passwordError}</span>
            </p>
          )}
          {successPassword && (
            <p className="flex items-center gap-2 text-sm leading-6 text-emerald-200">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              <span>Password atualizada.</span>
            </p>
          )}
          <Button type="submit" disabled={isPending}>
            <KeyRound className="h-4 w-4" aria-hidden />
            <span>Alterar password</span>
          </Button>
        </form>
      </Tabs.Content>
      <Tabs.Content value="empresa" className="space-y-4">
        {isCompany ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-zinc-950/25 p-5 ring-1 ring-inset ring-emerald-500/20">
              <p className="font-medium tracking-tight text-zinc-100">Perfil de empresa ativo</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                O seu perfil está registado como empresa. Na página inicial e em cada reclamação pode usar o botão &quot;Responder como Empresa&quot; para publicar uma resposta oficial (com ícone de
                verificação).
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-950/25 p-5 ring-1 ring-inset ring-zinc-800/70 space-y-4">
              <p className="text-sm font-medium tracking-tight text-zinc-100">Empresas que representa</p>
              <form
                onSubmit={onCreateCompany}
                className="grid gap-3 rounded-xl bg-zinc-950/40 p-4 ring-1 ring-inset ring-zinc-800/80"
              >
                <div className="grid gap-2">
                  <Label htmlFor="company-name">Nome da empresa</Label>
                  <Input
                    id="company-name"
                    name="name"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Ex: ACME, S.A."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company-website">Website (opcional)</Label>
                  <Input
                    id="company-website"
                    name="website"
                    value={newCompanyWebsite}
                    onChange={(e) => setNewCompanyWebsite(e.target.value)}
                    placeholder="https://empresa.pt"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company-description">Descrição (opcional)</Label>
                  <Input
                    id="company-description"
                    name="description"
                    value={newCompanyDescription}
                    onChange={(e) => setNewCompanyDescription(e.target.value)}
                    placeholder="Resumo curto sobre a empresa"
                  />
                </div>
                <div className="pt-1">
                  <Button type="submit" size="sm" disabled={isPending}>
                    <Building2 className="h-4 w-4" aria-hidden />
                    <span>Adicionar empresa</span>
                  </Button>
                </div>
              </form>
              {companies.length === 0 ? (
                <p className="text-sm leading-6 text-zinc-400">
                  Ainda não registou nenhuma empresa associada a este perfil. Utilize o formulário acima para adicionar a primeira.
                </p>
              ) : (
                <div className="space-y-3">
                  {companies.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4"
                    >
                      <p className="text-sm font-semibold tracking-tight text-zinc-100">{c.name}</p>
                      {c.website && (
                        <p className="text-xs text-emerald-300/90 break-all">{c.website}</p>
                      )}
                      {c.description && (
                        <p className="mt-1 text-xs leading-5 text-zinc-400">{c.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <form onSubmit={(event) => onUpdateCompany(event, c.id)} className="flex flex-wrap items-center gap-2">
                          <Input
                            name="name"
                            defaultValue={c.name}
                            className="h-8 max-w-[180px] text-xs"
                          />
                          <Input
                            name="website"
                            defaultValue={c.website ?? ""}
                            placeholder="Website"
                            className="h-8 max-w-[180px] text-xs"
                          />
                          <Input
                            name="description"
                            defaultValue={c.description ?? ""}
                            placeholder="Descrição"
                            className="h-8 max-w-[220px] text-xs"
                          />
                          <Button type="submit" size="sm" className="h-8 rounded-xl px-3 text-xs" disabled={isPending}>
                            <Save className="h-3.5 w-3.5" aria-hidden />
                            <span>Guardar</span>
                          </Button>
                        </form>
                        <form onSubmit={(event) => { event.preventDefault(); onDeleteCompany(c.id); }}>
                          <Button
                            type="button"
                            onClick={() => onDeleteCompany(c.id)}
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            className="h-8 rounded-xl px-2 text-xs text-red-300 hover:text-red-200"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden />
                            <span>Eliminar</span>
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-zinc-400">
              Ative o perfil de empresa para poder responder oficialmente a reclamações. A sua resposta aparecerá com destaque e ícone de verificação em cada reclamação.
            </p>
            <form className="space-y-2">
              <Button type="button" onClick={onActivateCompanyRole} disabled={isPending}>
                <Building2 className="h-4 w-4" aria-hidden />
                <span>Ativar perfil de empresa</span>
              </Button>
            </form>
            {roleError && (
              <p className="flex items-start gap-2 text-sm leading-6 text-red-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{roleError}</span>
              </p>
            )}
          </div>
        )}
      </Tabs.Content>
    </Tabs.Root>
  );
}
