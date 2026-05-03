import * as userRepository from "../repositories/userRepository";
import * as notificationRepository from "../repositories/notification-repository";
import { sendComplaintUpdateEmail } from "./email-service";

export async function notifyTopicNewComplaint(params: {
  topicSlug: string;
  topicTitle: string;
  complaintId: string;
  complaintTitle?: string | null;
  excludeUserId?: string | null;
}) {
  const followers = await userRepository.findUsersFollowingTopic(params.topicSlug);
  const titleShort = (params.complaintTitle ?? "Nova denúncia").slice(0, 80);
  const recipients = followers.filter((u) => String(u._id) !== (params.excludeUserId ?? ""));
  if (!recipients.length) return;
  await notificationRepository.createMany(
    recipients.map((user) => ({
      userId: String(user._id),
      title: `/${params.topicSlug}`,
      message: `Novo no tópico «${params.topicTitle}»: ${titleShort}`,
      complaintId: params.complaintId,
    }))
  );
}

export async function notifyComplaintUpdate(params: {
  complaintId: string;
  status: string;
  title?: string;
  message?: string;
}) {
  const subscribers = await userRepository.getSubscribedUsersForComplaint(params.complaintId);
  if (!subscribers.length) return;
  const title = params.title ?? "Atualização de denúncia";
  const message =
    params.message ?? `O estado da denúncia foi atualizado para: ${params.status}.`;
  await Promise.all(
    subscribers.map((user) =>
      sendComplaintUpdateEmail({
        to: user.email,
        complaintId: params.complaintId,
        status: params.status,
      })
    )
  );
  await notificationRepository.createMany(
    subscribers.map((user) => ({
      userId: String(user._id),
      title,
      message,
      complaintId: params.complaintId,
    }))
  );
}
