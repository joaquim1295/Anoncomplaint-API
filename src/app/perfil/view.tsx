"use client";

import Image from "next/image";
import * as Tabs from "@radix-ui/react-tabs";
import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Building2, CheckCircle2, ImagePlus, KeyRound, Save, Trash2, User2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Textarea } from "../../components/ui/Textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/Dialog";
import { cn } from "../../lib/utils";
import { UserRole } from "../../types/user";
import { useI18n } from "../../components/providers/I18nProvider";
import type { AppLocale } from "../../lib/i18n/constants";

function localeToBcp47(locale: AppLocale): string {
  if (locale === "pt") return "pt-PT";
  if (locale === "es") return "es-ES";
  return "en-US";
}

type User = {
  userId: string;
  email: string;
  username?: string;
  profile_image?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  public_profile_enabled?: boolean;
  role: string;
};

type Company = {
  id: string;
  slug?: string | null;
  name: string;
  taxId?: string | null;
  website?: string | null;
  description?: string | null;
  logo_image?: string | null;
  created_at: string | Date;
};

export function PerfilView({ user, companies }: { user: User; companies: Company[] }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [usernameError, setUsernameError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [roleError, setRoleError] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState(user.username ?? "");
  const [successUsername, setSuccessUsername] = useState(false);
  const [profileImage, setProfileImage] = useState(user.profile_image ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [website, setWebsite] = useState(user.website ?? "");
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(Boolean(user.public_profile_enabled));
  const [successPassword, setSuccessPassword] = useState(false);
  const isCompany = user.role === UserRole.COMPANY;
  const isAdmin = user.role === UserRole.ADMIN;
  const canManageCompanies = isCompany || isAdmin;
  const [requestCompanyName, setRequestCompanyName] = useState("");
  const [requestCompanyWebsite, setRequestCompanyWebsite] = useState("");
  const [requestContactName, setRequestContactName] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyWebsite, setNewCompanyWebsite] = useState("");
  const [newCompanyTaxId, setNewCompanyTaxId] = useState("");
  const [newCompanyDescription, setNewCompanyDescription] = useState("");
  const [newCompanyLogoImage, setNewCompanyLogoImage] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteCurrentPassword, setDeleteCurrentPassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);

  useEffect(() => {
    setUsername(user.username ?? "");
    setProfileImage(user.profile_image ?? "");
    setBio(user.bio ?? "");
    setLocation(user.location ?? "");
    setWebsite(user.website ?? "");
    setPublicProfileEnabled(Boolean(user.public_profile_enabled));
  }, [user.username, user.profile_image, user.bio, user.location, user.website, user.public_profile_enabled]);

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error(t("profile.imageReadError")));
      reader.readAsDataURL(file);
    });
  }

  async function onSubmitUsername(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUsernameError(undefined);
    setSuccessUsername(false);
    startTransition(async () => {
      const response = await fetch("/api/v1/users/me/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username,
          profile_image: profileImage || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
          website: website.trim() || null,
          public_profile_enabled: publicProfileEnabled,
        }),
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
        body: JSON.stringify({
          company_name: requestCompanyName,
          company_website: requestCompanyWebsite,
          company_contact_name: requestContactName,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setRoleError(result?.error?.message ?? t("profile.verifyRequestFail"));
        return;
      }
      setRequestCompanyName("");
      setRequestCompanyWebsite("");
      setRequestContactName("");
      setRoleError(t("profile.verifyRequestSent"));
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
          logo_image: newCompanyLogoImage || undefined,
          taxId: newCompanyTaxId || undefined,
          website: newCompanyWebsite || undefined,
          description: newCompanyDescription || undefined,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.error?.message ?? t("profile.companyCreateFail"));
        return;
      }
      toast.success(t("profile.companyCreated"));
      setNewCompanyName("");
      setNewCompanyWebsite("");
      setNewCompanyTaxId("");
      setNewCompanyDescription("");
      setNewCompanyLogoImage("");
      router.refresh();
    });
  }

  function onDeactivateCompanyRole() {
    setRoleError(undefined);
    startTransition(async () => {
      const response = await fetch("/api/v1/users/me/role", {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setRoleError(result?.error?.message ?? t("profile.companyDeactivateFail"));
        return;
      }
      setRoleError(t("profile.companyDeactivated"));
      router.refresh();
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
          logo_image: String(formData.get("logo_image") ?? "") || undefined,
          taxId: String(formData.get("taxId") ?? "") || undefined,
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

  function onSoftDeleteAccount() {
    setDeleteError(undefined);
    startTransition(async () => {
      const response = await fetch("/api/v1/users/me/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          confirm: "DELETE",
          currentPassword: deleteCurrentPassword,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setDeleteError(result?.error?.message ?? "Não foi possível desativar a conta.");
        return;
      }
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
      setDeleteOpen(false);
      setDeleteConfirmText("");
      setDeleteCurrentPassword("");
      router.push("/login?from=/");
      router.refresh();
    });
  }

  return (
    <Tabs.Root defaultValue="dados" className="w-full max-w-full">
      <Tabs.List className="mb-6 flex flex-wrap gap-2 border-b border-zinc-200/90 pb-3 dark:border-zinc-800/70">
        <Tabs.Trigger
          value="dados"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight ring-cyber transition",
            "data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-900 data-[state=active]:ring-emerald-500/30 dark:data-[state=active]:text-emerald-200 dark:data-[state=active]:ring-emerald-500/25",
            "data-[state=inactive]:text-zinc-600 hover:bg-zinc-100/90 hover:text-zinc-900 dark:data-[state=inactive]:text-zinc-400 dark:hover:bg-zinc-900/45 dark:hover:text-zinc-100"
          )}
        >
          <User2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
          <span>{t("profile.tabData")}</span>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="seguranca"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight ring-cyber transition",
            "data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-900 data-[state=active]:ring-emerald-500/30 dark:data-[state=active]:text-emerald-200 dark:data-[state=active]:ring-emerald-500/25",
            "data-[state=inactive]:text-zinc-600 hover:bg-zinc-100/90 hover:text-zinc-900 dark:data-[state=inactive]:text-zinc-400 dark:hover:bg-zinc-900/45 dark:hover:text-zinc-100"
          )}
        >
          <KeyRound className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
          <span>{t("profile.tabSecurity")}</span>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="empresa"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight ring-cyber transition",
            "data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-900 data-[state=active]:ring-emerald-500/30 dark:data-[state=active]:text-emerald-200 dark:data-[state=active]:ring-emerald-500/25",
            "data-[state=inactive]:text-zinc-600 hover:bg-zinc-100/90 hover:text-zinc-900 dark:data-[state=inactive]:text-zinc-400 dark:hover:bg-zinc-900/45 dark:hover:text-zinc-100"
          )}
        >
          <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
          <span>{t("profile.tabCompany")}</span>
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="dados" className="space-y-4">
        <form onSubmit={onSubmitUsername} className="grid gap-4 lg:grid-cols-5">
          <section className="space-y-3 rounded-2xl border border-zinc-200/90 bg-zinc-50/85 p-4 lg:col-span-2 dark:border-zinc-800/70 dark:bg-zinc-950/25">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("profile.email")}</p>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{user.email}</p>
            <div className="pt-2">
              {profileImage ? (
                profileImage.startsWith("data:") ? (
                  <img
                    src={profileImage}
                    alt={t("profile.avatarAlt")}
                    className="h-24 w-24 rounded-full object-cover ring-1 ring-zinc-300/90 dark:ring-zinc-700/80"
                  />
                ) : (
                  <Image
                    src={profileImage}
                    alt={t("profile.avatarAlt")}
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-full object-cover ring-1 ring-zinc-300/90 dark:ring-zinc-700/80"
                    unoptimized
                  />
                )
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 ring-1 ring-zinc-300/90 dark:bg-zinc-900/70 dark:ring-zinc-700/80">
                  <User2 className="h-9 w-9 text-emerald-600 dark:text-emerald-300/90" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("profile.photoLabel")}</Label>
              <Input
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder={t("profile.photoPlaceholder")}
              />
              <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-zinc-300/90 bg-zinc-50/80 px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-900/45">
                <ImagePlus className="h-4 w-4" />
                {t("profile.upload")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const input = e.currentTarget;
                    const file = input.files?.[0];
                    if (!file) return;
                    try {
                      const base64 = await fileToBase64(file);
                      setProfileImage(base64);
                    } finally {
                      input.value = "";
                    }
                  }}
                />
              </label>
            </div>
            <div className="space-y-3 rounded-xl border border-zinc-200/90 bg-white/90 p-3 dark:border-zinc-800/70 dark:bg-zinc-950/25">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={publicProfileEnabled}
                  onChange={(e) => setPublicProfileEnabled(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  {t("profile.publicEnable")}{" "}
                  <code className="rounded bg-zinc-200/70 px-1 py-0.5 text-xs dark:bg-zinc-800/80">/u/{user.userId}</code>.
                </span>
              </label>
              {publicProfileEnabled ? (
                <Link
                  href={`/u/${user.userId}`}
                  target="_blank"
                  className="inline-flex rounded-lg text-xs font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200"
                >
                  {t("profile.viewPublic")}
                </Link>
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("profile.publicDisabled")}</p>
              )}
            </div>
          </section>
          <section className="space-y-4 rounded-2xl border border-zinc-200/90 bg-white/85 p-4 lg:col-span-3 dark:border-zinc-800/70 dark:bg-zinc-950/25">
            <div className="space-y-2">
              <Label htmlFor="username">{t("profile.username")}</Label>
              <Input
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("profile.usernamePlaceholder")}
                className="max-w-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">{t("profile.bio")}</Label>
              <Textarea
                id="bio"
                name="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("profile.bioPlaceholder")}
                maxLength={280}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{bio.length}/280</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">{t("profile.location")}</Label>
                <Input
                  id="location"
                  name="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("profile.locationPlaceholder")}
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">{t("profile.website")}</Label>
                <Input
                  id="website"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder={t("profile.websitePlaceholder")}
                  maxLength={240}
                />
              </div>
            </div>
          </section>
          {usernameError && (
            <p className="lg:col-span-5 flex items-start gap-2 text-sm leading-6 text-red-600 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{usernameError}</span>
            </p>
          )}
          {successUsername && (
            <p className="lg:col-span-5 flex items-center gap-2 text-sm leading-6 text-emerald-700 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              <span>{t("profile.usernameUpdated")}</span>
            </p>
          )}
          <div className="lg:col-span-5">
            <Button type="submit" disabled={isPending}>
              <Save className="h-4 w-4" aria-hidden />
              <span>{t("profile.saveProfile")}</span>
            </Button>
          </div>
        </form>
      </Tabs.Content>
      <Tabs.Content value="seguranca" className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <form onSubmit={onSubmitPassword} className="space-y-4 rounded-2xl border border-zinc-200/90 bg-white/85 p-4 dark:border-zinc-800/70 dark:bg-zinc-950/25">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t("profile.changePassword")}</p>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t("profile.currentPassword")}</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                placeholder={t("profile.passwordPlaceholder")}
                className="max-w-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("profile.newPassword")}</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder={t("profile.passwordPlaceholder")}
                className="max-w-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("profile.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder={t("profile.passwordPlaceholder")}
                className="max-w-xs"
              />
            </div>
            {passwordError && (
              <p className="flex items-start gap-2 text-sm leading-6 text-red-600 dark:text-red-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{passwordError}</span>
              </p>
            )}
            {successPassword && (
              <p className="flex items-center gap-2 text-sm leading-6 text-emerald-700 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                <span>{t("profile.passwordUpdated")}</span>
              </p>
            )}
            <Button type="submit" disabled={isPending}>
              <KeyRound className="h-4 w-4" aria-hidden />
              <span>{t("profile.savePassword")}</span>
            </Button>
          </form>
          <div className="space-y-3 rounded-2xl border border-red-200/90 bg-red-50/70 p-4 dark:border-red-900/60 dark:bg-red-950/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Zona de risco</p>
            <p className="text-sm leading-6 text-red-700/90 dark:text-red-200/90">
              Ao desativar a conta, o acesso é bloqueado (soft delete) e o perfil público deixa de estar visível.
            </p>
            <Dialog
              open={deleteOpen}
              onOpenChange={(open) => {
                setDeleteOpen(open);
                if (!open) {
                  setDeleteConfirmText("");
                  setDeleteCurrentPassword("");
                  setDeleteError(undefined);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button type="button" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900/30">
                  <Trash2 className="h-4 w-4" aria-hidden />
                  <span>Desativar conta</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar desativação da conta</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    Esta ação faz soft delete da conta. Confirme com a password atual e escreva <strong>DELETE</strong>.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="delete-current-password">Palavra-passe actual</Label>
                    <Input
                      id="delete-current-password"
                      type="password"
                      autoComplete="current-password"
                      value={deleteCurrentPassword}
                      onChange={(e) => setDeleteCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Escreva DELETE"
                  />
                  {deleteError ? <p className="text-sm text-red-600 dark:text-red-300">{deleteError}</p> : null}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        isPending ||
                        deleteConfirmText.trim() !== "DELETE" ||
                        deleteCurrentPassword.trim().length === 0
                      }
                      onClick={onSoftDeleteAccount}
                      className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900/30"
                    >
                      Confirmar desativação
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Tabs.Content>
      <Tabs.Content value="empresa" className="space-y-4">
        {canManageCompanies ? (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50/60 p-5 ring-1 ring-inset ring-emerald-500/25 dark:bg-zinc-950/25 dark:ring-emerald-500/20">
                <p className="font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                  {isAdmin ? t("profileCompany.activeAdmin") : t("profileCompany.activeUser")}
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {isAdmin ? t("profileCompany.helpAdmin") : t("profileCompany.helpUser")}
                </p>
                {!isAdmin && (
                  <div className="mt-4">
                    <Button type="button" variant="outline" onClick={onDeactivateCompanyRole} disabled={isPending}>
                      <AlertTriangle className="h-4 w-4" aria-hidden />
                      <span>{t("profileCompany.deactivate")}</span>
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-4 rounded-2xl bg-zinc-50/90 p-5 ring-1 ring-inset ring-zinc-200/90 dark:bg-zinc-950/25 dark:ring-zinc-800/70">
                <p className="text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-100">{t("profileCompany.newCompany")}</p>
                <form
                  onSubmit={onCreateCompany}
                  className="grid gap-3 rounded-xl bg-white/80 p-4 ring-1 ring-inset ring-zinc-200/90 dark:bg-zinc-950/40 dark:ring-zinc-800/80"
                >
                  <div className="grid gap-2">
                    <Label htmlFor="company-name">{t("profileCompany.formCompanyName")}</Label>
                    <Input
                      id="company-name"
                      name="name"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder={t("profileCompany.formCompanyNamePh")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company-logo">{t("profileCompany.formLogo")}</Label>
                    <Input
                      id="company-logo"
                      name="logo_image"
                      value={newCompanyLogoImage}
                      onChange={(e) => setNewCompanyLogoImage(e.target.value)}
                      placeholder="https://empresa.pt/logo.png"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company-taxid">{t("profileCompany.formTax")}</Label>
                    <Input
                      id="company-taxid"
                      name="taxId"
                      value={newCompanyTaxId}
                      onChange={(e) => setNewCompanyTaxId(e.target.value)}
                      placeholder={t("profileCompany.formTaxPh")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company-website">{t("profileCompany.formWebsite")}</Label>
                    <Input
                      id="company-website"
                      name="website"
                      value={newCompanyWebsite}
                      onChange={(e) => setNewCompanyWebsite(e.target.value)}
                      placeholder="https://empresa.pt"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company-description">{t("profileCompany.formDesc")}</Label>
                    <Input
                      id="company-description"
                      name="description"
                      value={newCompanyDescription}
                      onChange={(e) => setNewCompanyDescription(e.target.value)}
                      placeholder={t("profileCompany.formDescPh")}
                    />
                  </div>
                  <div className="pt-1">
                    <Button type="submit" size="sm" disabled={isPending}>
                      <Building2 className="h-4 w-4" aria-hidden />
                      <span>{t("profileCompany.addCompany")}</span>
                    </Button>
                  </div>
                </form>
              </div>
            </div>
            <div className="space-y-4 rounded-2xl bg-zinc-50/90 p-5 ring-1 ring-inset ring-zinc-200/90 dark:bg-zinc-950/25 dark:ring-zinc-800/70">
              <p className="text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-100">{t("profileCompany.representedTitle")}</p>
              {companies.length === 0 ? (
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{t("profileCompany.representedEmpty")}</p>
              ) : (
                <div className="space-y-3">
                  {companies.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-zinc-200/90 bg-white/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/40"
                    >
                      <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{c.name}</p>
                      {c.website && (
                        <p className="text-xs break-all text-emerald-700 dark:text-emerald-300/90">{c.website}</p>
                      )}
                      {c.logo_image ? (
                        c.logo_image.startsWith("data:") ? (
                          <img
                            src={c.logo_image}
                            alt={c.name}
                            className="mt-2 h-10 w-10 rounded-lg object-cover ring-1 ring-zinc-700/80"
                          />
                        ) : (
                          <Image
                            src={c.logo_image}
                            alt={c.name}
                            width={40}
                            height={40}
                            className="mt-2 h-10 w-10 rounded-lg object-cover ring-1 ring-zinc-700/80"
                            unoptimized
                          />
                        )
                      ) : null}
                      {c.taxId && (
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                          {t("profileCompany.taxIdPrefix")} {c.taxId}
                        </p>
                      )}
                      {c.description && (
                        <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{c.description}</p>
                      )}
                      <div className="mt-3 space-y-3">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <span>
                            {t("profileCompany.createdOn")}{" "}
                            {new Date(c.created_at).toLocaleDateString(localeToBcp47(locale))}
                          </span>
                          {c.slug ? (
                            <Link href={`/empresa/${c.slug}`} className="text-emerald-700 hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200">
                              {t("profileCompany.viewCompanyPublic")}
                            </Link>
                          ) : null}
                        </div>
                        <form onSubmit={(event) => onUpdateCompany(event, c.id)} className="grid gap-3 rounded-xl bg-zinc-50/80 p-3 ring-1 ring-zinc-200/80 dark:bg-zinc-950/30 dark:ring-zinc-800/70">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">{t("profileCompany.labelPublicName")}</Label>
                              <Input name="name" defaultValue={c.name} className="h-9 text-xs" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">{t("profileCompany.labelLogoUrl")}</Label>
                              <Input name="logo_image" defaultValue={c.logo_image ?? ""} placeholder="https://empresa.pt/logo.png" className="h-9 text-xs" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">{t("profileCompany.labelTax")}</Label>
                              <Input name="taxId" defaultValue={c.taxId ?? ""} placeholder="123456789" className="h-9 text-xs" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">{t("profileCompany.labelWebsiteShort")}</Label>
                              <Input name="website" defaultValue={c.website ?? ""} placeholder="https://empresa.pt" className="h-9 text-xs" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">{t("profileCompany.labelPublicDesc")}</Label>
                            <Textarea
                              name="description"
                              defaultValue={c.description ?? ""}
                              placeholder={t("profileCompany.publicDescPlaceholder")}
                              className="min-h-[88px] text-xs"
                              maxLength={600}
                            />
                          </div>
                          <Button type="submit" size="sm" className="h-8 w-fit rounded-xl px-3 text-xs" disabled={isPending}>
                            <Save className="h-3.5 w-3.5" aria-hidden />
                            <span>{t("profileCompany.save")}</span>
                          </Button>
                        </form>
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            onDeleteCompany(c.id);
                          }}
                        >
                          <Button
                            type="button"
                            onClick={() => onDeleteCompany(c.id)}
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            className="h-8 rounded-xl px-2 text-xs text-red-300 hover:text-red-200"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden />
                            <span>{t("profileCompany.delete")}</span>
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
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{t("profileCompany.securityNote")}</p>
            <form
              className="space-y-3 rounded-2xl bg-zinc-50/90 p-4 ring-1 ring-inset ring-zinc-200/90 dark:bg-zinc-950/25 dark:ring-zinc-800/70"
              onSubmit={(event) => {
                event.preventDefault();
                onActivateCompanyRole();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="request-company-name">{t("profileCompany.requestCompanyName")}</Label>
                <Input
                  id="request-company-name"
                  value={requestCompanyName}
                  onChange={(event) => setRequestCompanyName(event.target.value)}
                  placeholder={t("profileCompany.formCompanyNamePh")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-company-website">{t("profileCompany.requestCompanyWebsite")}</Label>
                <Input
                  id="request-company-website"
                  value={requestCompanyWebsite}
                  onChange={(event) => setRequestCompanyWebsite(event.target.value)}
                  placeholder="https://empresa.pt"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-contact-name">{t("profileCompany.requestContactName")}</Label>
                <Input
                  id="request-contact-name"
                  value={requestContactName}
                  onChange={(event) => setRequestContactName(event.target.value)}
                  placeholder={t("profileCompany.requestContactPlaceholder")}
                  required
                />
              </div>
              <Button type="button" onClick={onActivateCompanyRole} disabled={isPending}>
                <Building2 className="h-4 w-4" aria-hidden />
                <span>{t("profileCompany.requestVerify")}</span>
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
