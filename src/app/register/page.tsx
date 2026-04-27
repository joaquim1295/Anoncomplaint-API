import Link from "next/link";
import { RegisterForm } from "../../components/RegisterForm";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <RegisterForm />
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-300 ring-cyber transition hover:bg-zinc-900/45 hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4 text-emerald-300/90" aria-hidden />
        <span>Voltar ao início</span>
      </Link>
    </div>
  );
}
