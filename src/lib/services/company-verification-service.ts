import crypto from "node:crypto";
import * as companyVerificationRepository from "../repositories/companyVerificationRepository";
import { CompanyVerificationStatus } from "../../types/companyVerification";
const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

const PUBLIC_MAIL_DOMAINS = new Set([
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
]);

function normalizeWebsite(website: string): URL | null {
  try {
    const value = website.startsWith("http://") || website.startsWith("https://")
      ? website
      : `https://${website}`;
    return new URL(value);
  } catch {
    return null;
  }
}

function normalizeEmailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase().trim() ?? "";
}

export function validateCorporateIdentity(email: string, website: string): { ok: true } | { ok: false; error: string } {
  const emailDomain = normalizeEmailDomain(email);
  if (!emailDomain) return { ok: false, error: "Email inválido." };
  if (PUBLIC_MAIL_DOMAINS.has(emailDomain)) {
    return { ok: false, error: "Use um email corporativo (domínio da empresa)." };
  }
  const parsedWebsite = normalizeWebsite(website);
  if (!parsedWebsite) return { ok: false, error: "Website da empresa inválido." };
  const websiteHost = parsedWebsite.hostname.replace(/^www\./, "").toLowerCase();
  if (!emailDomain.endsWith(websiteHost) && !websiteHost.endsWith(emailDomain)) {
    return {
      ok: false,
      error: "O domínio do email corporativo deve corresponder ao website oficial.",
    };
  }
  return { ok: true };
}

export async function createVerificationRequest(params: {
  userId: string;
  email: string;
  companyName: string;
  companyWebsite: string;
  contactName: string;
}): Promise<
  | { success: true; requestId: string; token: string }
  | { success: false; error: string }
> {
  const identity = validateCorporateIdentity(params.email, params.companyWebsite);
  if (!identity.ok) return { success: false, error: identity.error };

  const latest = await companyVerificationRepository.findLatestByUserId(params.userId);
  if (
    latest &&
    [CompanyVerificationStatus.PENDING, CompanyVerificationStatus.EMAIL_VERIFIED, CompanyVerificationStatus.APPROVED].includes(latest.status)
  ) {
    return { success: false, error: "Já existe um pedido em curso ou aprovado para esta conta." };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
  const created = await companyVerificationRepository.create({
    ...params,
    email: params.email.toLowerCase().trim(),
    companyName: params.companyName.trim(),
    companyWebsite: params.companyWebsite.trim(),
    contactName: params.contactName.trim(),
    emailVerificationToken: token,
    expiresAt,
  });

  return { success: true, requestId: String(created._id), token };
}

