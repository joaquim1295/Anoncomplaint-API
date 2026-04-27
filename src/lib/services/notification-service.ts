import * as userRepository from "../repositories/userRepository";
import * as notificationRepository from "../repositories/notification-repository";
import { sendComplaintUpdateEmail } from "./email-service";

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
    subscribers.map(async (user) => {
      await Promise.all([
        sendComplaintUpdateEmail({
          to: user.email,
          complaintId: params.complaintId,
          status: params.status,
        }),
        notificationRepository.create({
          userId: String(user._id),
          title,
          message,
          complaintId: params.complaintId,
        }),
      ]);
    })
  );
}
