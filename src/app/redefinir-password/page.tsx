"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!token) {
      setMsg("Token em falta.");
      return;
    }
    setPending(true);
    const res = await fetch("/api/v1/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const j = await res.json().catch(() => null);
    setPending(false);
    if (!res.ok) {
      setMsg(j?.error?.message ?? "Não foi possível redefinir.");
      return;
    }
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Nova password</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="Nova password (mín. 8)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          maxLength={128}
          required
        />
        {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "A guardar…" : "Guardar"}
        </Button>
      </form>
    </div>
  );
}

export default function RedefinirPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-500">A carregar…</div>}>
      <Inner />
    </Suspense>
  );
}
