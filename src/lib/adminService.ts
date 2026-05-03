import * as userRepository from "./repositories/userRepository";
import * as complaintRepository from "./repositories/complaintRepository";
import * as companyVerificationRepository from "./repositories/companyVerificationRepository";
import * as companyService from "./companyService";
import { invalidateComplaintAggregateCaches } from "./complaintService";
import type { UserDocument } from "../models/User";
import type { ComplaintDocument } from "../models/Complaint";
import type { CompanyVerificationRequestDocument } from "../models/CompanyVerificationRequest";
import { CompanyVerificationStatus } from "../types/companyVerification";
import { UserRole } from "../types/user";
import { sendCompanyApprovedEmail } from "./services/email-service";
import { triggerRealtimeEvent } from "./realtime/pusher-server";
import type { AppLocale } from "./i18n/constants";
import { DEFAULT_LOCALE } from "./i18n/constants";
import { loadMessages } from "./i18n/server";
import { getMessage } from "./i18n/dict";

export async function getAllUsers(): Promise<UserDocument[]> {
  return userRepository.findAll();
}

export async function getAllComplaints(): Promise<ComplaintDocument[]> {
  return complaintRepository.findAll();
}

export async function banUser(userId: string): Promise<UserDocument | null> {
  return userRepository.setBannedAt(userId, new Date());
}

export async function forceDeleteComplaint(complaintId: string): Promise<boolean> {
  const ok = await complaintRepository.forceDelete(complaintId);
  if (ok) invalidateComplaintAggregateCaches();
  return ok;
}

export async function updateComplaintAttachments(
  complaintId: string,
  attachments: string[]
): Promise<ComplaintDocument | null> {
  const doc = await complaintRepository.update(complaintId, { attachments });
  if (doc) invalidateComplaintAggregateCaches();
  return doc;
}

export async function getPendingCompanyVerificationRequests(): Promise<CompanyVerificationRequestDocument[]> {
  return companyVerificationRepository.listPendingForAdmin();
}

export async function approveCompanyVerificationRequest(
  requestId: string,
  adminUserId: string,
  options?: { locale?: AppLocale }
): Promise<
  | { success: true; userId: string }
  | { success: false; error: string }
> {
  const request = await companyVerificationRepository.findById(requestId);
  if (!request) return { success: false, error: "Pedido não encontrado." };
  if (request.status !== CompanyVerificationStatus.EMAIL_VERIFIED) {
    return { success: false, error: "Pedido não está elegível para aprovação (confirme o email primeiro)." };
  }
  const user = await userRepository.findUserById(request.userId);
  if (!user) return { success: false, error: "Utilizador não encontrado." };
  if (user.role === UserRole.COMPANY) {
    return { success: false, error: "Este utilizador já é empresa." };
  }

  const roleUpdated = await userRepository.updateById(request.userId, { role: UserRole.COMPANY });
  if (!roleUpdated) return { success: false, error: "Falha ao promover utilizador para empresa." };

  const loc = options?.locale ?? DEFAULT_LOCALE;
  const messages = await loadMessages(loc);
  const description = getMessage(messages, "company.autoOfficialDescription").replace("{{name}}", request.companyName);

  await companyService.createForUser(request.userId, {
    name: request.companyName,
    website: request.companyWebsite,
    description,
  });

  await companyVerificationRepository.markApproved(requestId, adminUserId);
  await sendCompanyApprovedEmail({
    to: request.email,
    companyName: request.companyName,
  });
  return { success: true, userId: request.userId };
}

export async function rejectCompanyVerificationRequest(
  requestId: string,
  adminUserId: string
): Promise<
  | { success: true; userId: string }
  | { success: false; error: string }
> {
  const request = await companyVerificationRepository.findById(requestId);
  if (!request) return { success: false, error: "Pedido não encontrado." };
  if (request.status === CompanyVerificationStatus.APPROVED) {
    return { success: false, error: "Pedido já aprovado não pode ser rejeitado." };
  }
  const updated = await companyVerificationRepository.markRejected(requestId, adminUserId);
  if (!updated) return { success: false, error: "Não foi possível rejeitar o pedido." };
  return { success: true, userId: request.userId };
}

export async function forceApproveCurrentUser(
  userId: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_GOD_MODE !== "1") {
    return { success: false, error: "Operação desativada em produção (ALLOW_GOD_MODE)." };
  }
  const user = await userRepository.findUserById(userId);
  if (!user) return { success: false, error: "Utilizador não encontrado." };
  const roleUpdated = await userRepository.setRole(userId, UserRole.COMPANY);
  if (!roleUpdated) return { success: false, error: "Falha ao promover para COMPANY." };
  return { success: true };
}

export async function simulateRealtimeResponse(slug?: string): Promise<void> {
  await triggerRealtimeEvent("complaints-feed", "complaint-updated", {
    complaintId: "demo",
    type: "simulated",
  });
  if (slug) {
    await triggerRealtimeEvent(`company-${slug}`, "views-updated", {
      views: Math.floor(Math.random() * 10000),
    });
  }
}

export async function resetDemoData(): Promise<{ deleted: number }> {
  const deleted = await complaintRepository.deleteAll();
  await complaintRepository.create({
    author_id: null,
    ghost_mode: true,
    title: "Demo: entrega atrasada",
    content: "Demo: entrega atrasada sem atualização.",
    tags: ["logistica", "demo"],
  });
  await complaintRepository.create({
    author_id: null,
    ghost_mode: true,
    title: "Demo: atendimento não respondido",
    content: "Demo: atendimento não respondeu ao suporte.",
    tags: ["suporte", "demo"],
  });
  await complaintRepository.create({
    author_id: null,
    ghost_mode: false,
    title: "Demo: fatura cobrada em duplicado",
    content: "Demo: fatura cobrada em duplicado.",
    tags: ["financeiro", "demo"],
  });
  await triggerRealtimeEvent("complaints-feed", "complaint-updated", {
    complaintId: "demo-reset",
    type: "reset",
  });
  invalidateComplaintAggregateCaches();
  return { deleted };
}
