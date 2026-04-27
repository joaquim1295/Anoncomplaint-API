import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowLeft, Inbox } from "lucide-react";
import { getCurrentUser } from "../../lib/getUser";
import * as complaintService from "../../lib/complaintService";
import { ComplaintItem } from "../../components/ComplaintItem";
import { DeleteComplaintButton } from "../../components/complaints/DeleteComplaintButton";

export default async function ActivitiesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?from=/activities");
  }

  const feed = await complaintService.getFeedByUserId(user.userId, { limit: 50 });

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
            <Activity className="h-4 w-4 text-emerald-300/90" aria-hidden />
            <span>As minhas actividades</span>
          </h1>
        </header>
        <section>
          {feed.length === 0 ? (
            <div className="rounded-2xl bg-zinc-950/25 p-6 ring-1 ring-inset ring-zinc-800/70">
              <div className="flex items-center gap-3">
                <Inbox className="h-5 w-5 text-emerald-300/90" aria-hidden />
                <p className="text-sm leading-6 text-zinc-300">
                  Ainda não tem denúncias associadas à sua conta.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {feed.map((c) => (
                <ComplaintItem
                  key={c.id}
                  complaint={c}
                  currentUserId={user.userId}
                  currentUserRole={user.role}
                  isSubscribed={user.subscribedComplaints?.includes(c.id)}
                  actions={
                    <div className="flex justify-end">
                      <DeleteComplaintButton complaintId={c.id} />
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
