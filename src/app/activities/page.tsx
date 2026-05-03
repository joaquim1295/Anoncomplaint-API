import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { getI18n } from "../../lib/i18n/request";
import { getMessage } from "../../lib/i18n/dict";
import { getCurrentUser } from "../../lib/getUser";
import * as complaintService from "../../lib/complaintService";
import { ComplaintItem } from "../../components/ComplaintItem";
import { DeleteComplaintButton } from "../../components/complaints/DeleteComplaintButton";
import { EditOwnComplaintButton } from "../../components/complaints/EditOwnComplaintButton";

export const metadata: Metadata = {
  title: "As minhas actividades",
  description: "Denúncias e interações ligadas à sua conta.",
};

export default async function ActivitiesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?from=/activities");
  }

  const [feed, { messages }] = await Promise.all([
    complaintService.getFeedByUserId(user.userId, { limit: 50 }),
    getI18n(),
  ]);
  const tr = (key: string) => getMessage(messages, key);

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <PageHeader title={tr("activities.title")} iconName="activity" />
        <section>
          {feed.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-6 ring-1 ring-inset ring-zinc-200/60 dark:border-zinc-800/70 dark:bg-zinc-950/25 dark:ring-zinc-800/70">
              <div className="flex items-center gap-3">
                <Inbox className="h-5 w-5 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">{tr("activities.emptyFeed")}</p>
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
                    <div className="flex flex-wrap justify-end gap-2">
                      <EditOwnComplaintButton
                        complaintId={c.id}
                        title={c.title ?? ""}
                        content={c.content}
                        disabled={(c.officialResponses ?? []).length > 0}
                        disabledReason={tr("activities.editDisabledAfterOfficial")}
                      />
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
