import { cookies } from "next/headers";
import { z } from "zod";
import * as authService from "../../../../../lib/authService";
import { UserRole } from "../../../../../types/user";
import { jsonData, jsonError } from "../../../../../lib/api/http";
import * as companyVerificationService from "../../../../../lib/services/company-verification-service";
import { sendCompanyVerificationEmail, sendUserEmailVerification } from "../../../../../lib/services/email-service";
import { authRegisterLimiter, getClientIp, rateLimitOrNull } from "../../../../../lib/rate-limit";

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "anon_session";
const MAX_AGE = 60 * 60 * 24 * 7;

const schema = z.object({
  email: z.string().email(),
  username: z.string().trim().min(1).max(50).optional(),
  password: z.string().min(8).max(128),
  register_as_company: z.boolean().optional(),
  company_name: z.string().trim().min(2).max(180).optional(),
  company_website: z.string().trim().min(4).max(250).optional(),
  company_contact_name: z.string().trim().min(2).max(120).optional(),
});

export async function POST(request: Request) {
  const limited = await rateLimitOrNull(authRegisterLimiter, getClientIp(request), "authRegister");
  if (limited) return limited;

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
  const result = await authService.register({
    email: parsed.data.email,
    username: parsed.data.username,
    password: parsed.data.password,
    role: UserRole.USER,
  });
  if (!result.success) {
    return jsonError("register_failed", result.error, 400);
  }
  let companyRequest: { requested: boolean; status: string; message: string } | undefined;
  if (parsed.data.register_as_company) {
    const companyName = parsed.data.company_name ?? "";
    const companyWebsite = parsed.data.company_website ?? "";
    const companyContactName = parsed.data.company_contact_name ?? "";
    const created = await companyVerificationService.createVerificationRequest({
      userId: String(result.user._id),
      email: result.user.email,
      companyName,
      companyWebsite,
      contactName: companyContactName,
    });
    if (!created.success) {
      return jsonError("company_request_failed", created.error, 400);
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const verificationUrl = `${baseUrl}/verificar-empresa?token=${encodeURIComponent(created.token)}`;
    await sendCompanyVerificationEmail({
      to: result.user.email,
      verificationUrl,
      companyName,
    });
    companyRequest = {
      requested: true,
      status: "pending_email_verification",
      message: "Pedido de empresa criado. Verifique o email corporativo para continuar.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  if (result.user.email_verify_token) {
    await sendUserEmailVerification({
      to: result.user.email,
      verifyUrl: `${baseUrl}/verificar-email?token=${encodeURIComponent(result.user.email_verify_token)}`,
    });
  }

  const token = await authService.generateJWT(String(result.user._id), result.user.role ?? UserRole.USER);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
  return jsonData(
    {
      token,
      id: String(result.user._id),
      email: result.user.email,
      username: result.user.username ?? null,
      role: result.user.role ?? UserRole.USER,
      companyRequest,
    },
    { status: 201 }
  );
}

