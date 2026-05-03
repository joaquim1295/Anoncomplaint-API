import { z } from "zod";
import { requireApiAuth } from "../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../lib/api/http";
import { getClientIp, rateLimitOrNull, roleChangeLimiter } from "../../../../../../lib/rate-limit";
import * as userRepository from "../../../../../../lib/repositories/userRepository";
import * as companyVerificationService from "../../../../../../lib/services/company-verification-service";
import { sendCompanyVerificationEmail } from "../../../../../../lib/services/email-service";
import { UserRole } from "../../../../../../types/user";

const schema = z.object({
  company_name: z.string().trim().min(2).max(180),
  company_website: z.string().trim().min(4).max(250),
  company_contact_name: z.string().trim().min(2).max(120),
});

export async function PATCH(request: Request) {
  const limited = await rateLimitOrNull(roleChangeLimiter, getClientIp(request), "roleChange");
  if (limited) return limited;

  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "Invalid JSON body", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation_error", "Invalid payload", 400, parsed.error.flatten());
  }
  const user = await userRepository.findUserById(auth.session.userId);
  if (!user) return jsonError("not_found", "User not found", 404);
  const created = await companyVerificationService.createVerificationRequest({
    userId: auth.session.userId,
    email: user.email,
    companyName: parsed.data.company_name,
    companyWebsite: parsed.data.company_website,
    contactName: parsed.data.company_contact_name,
  });
  if (!created.success) return jsonError("request_failed", created.error, 400);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const verificationUrl = `${baseUrl}/verificar-empresa?token=${encodeURIComponent(created.token)}`;
  await sendCompanyVerificationEmail({
    to: user.email,
    verificationUrl,
    companyName: parsed.data.company_name,
  });
  return jsonData({
    requested: true,
    status: "pending_email_verification",
    message: "Pedido enviado. Confirme o email corporativo para seguir para aprovação manual.",
  });
}

export async function DELETE(request: Request) {
  const auth = await requireApiAuth(request);
  if (!auth.ok) return auth.response;
  const user = await userRepository.findUserById(auth.session.userId);
  if (!user) return jsonError("not_found", "User not found", 404);
  if (user.role !== UserRole.COMPANY) {
    return jsonError("bad_request", "Perfil já não é empresa.", 400);
  }
  const updated = await userRepository.setRole(auth.session.userId, UserRole.USER);
  if (!updated) return jsonError("update_failed", "Não foi possível desativar perfil empresa.", 400);
  return jsonData({ role: UserRole.USER, deactivated: true });
}

