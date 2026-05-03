import { redirect } from "next/navigation";
import { PageHeader } from "../../components/layout/PageHeader";
import { getI18n } from "../../lib/i18n/request";
import { getMessage } from "../../lib/i18n/dict";
import { getCurrentUser } from "../../lib/getUser";
import * as notificationRepository from "../../lib/repositories/notification-repository";
import { NotificacoesView } from "./view";

export default async function NotificacoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/notificacoes");
  const docs = await notificationRepository.findByUserId(user.userId, { limit: 100, offset: 0 });
  const notifications = docs.map((n) => ({
    id: String(n._id),
    title: n.title,
    message: n.message,
    complaintId: n.complaintId ?? null,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  const { messages } = await getI18n();
  const tr = (key: string) => getMessage(messages, key);

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <PageHeader title={tr("notificacoes.title")} iconName="bell" />
        <NotificacoesView notifications={notifications} />
      </div>
    </div>
  );
}
