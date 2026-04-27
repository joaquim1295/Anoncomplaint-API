import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserCircle2 } from "lucide-react";
import { getCurrentUser } from "../../lib/getUser";
import { PerfilView } from "./view";
import * as companyService from "../../lib/companyService";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/perfil");
  const companies = await companyService.listForUser(user.userId);
  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/70 pb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-200 ring-cyber transition hover:bg-zinc-900/45 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-300/90" aria-hidden />
            <span>AnonComplaint</span>
          </Link>
          <h1 className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-100">
            <UserCircle2 className="h-4 w-4 text-emerald-300/90" aria-hidden />
            <span>O meu perfil</span>
          </h1>
        </header>
        <PerfilView user={user} companies={companies} />
      </div>
    </div>
  );
}
