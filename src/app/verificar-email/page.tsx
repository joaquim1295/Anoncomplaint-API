"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Inner() {
  const sp = useSearchParams();
  const token = sp.get("token")?.trim() ?? "";
  const [msg, setMsg] = useState("A confirmar…");
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setOk(false);
      setMsg("Token em falta no link.");
      return;
    }
    void (async () => {
      const res = await fetch("/api/v1/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        setOk(false);
        setMsg(j?.error?.message ?? "Verificação falhou.");
        return;
      }
      setOk(true);
      setMsg("Email confirmado. Pode continuar a utilizar a plataforma.");
    })();
  }, [token]);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Verificação de email</h1>
      <p className={`mt-4 text-sm ${ok === false ? "text-red-600" : "text-zinc-600 dark:text-zinc-400"}`}>{msg}</p>
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-500">A carregar…</div>}>
      <Inner />
    </Suspense>
  );
}
