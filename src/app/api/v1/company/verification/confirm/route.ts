import { NextResponse } from "next/server";
import { jsonData, jsonError } from "../../../../../../lib/api/http";
import * as companyVerificationRepository from "../../../../../../lib/repositories/companyVerificationRepository";
import { CompanyVerificationStatus } from "../../../../../../types/companyVerification";

async function runConfirm(token: string) {
  const found = await companyVerificationRepository.findByToken(token);
  if (!found) return { error: jsonError("not_found", "Pedido não encontrado.", 404) };
  if (new Date(found.expiresAt).getTime() < Date.now()) {
    return { error: jsonError("token_expired", "Token de verificação expirado.", 400) };
  }
  if (
    found.status === CompanyVerificationStatus.EMAIL_VERIFIED ||
    found.status === CompanyVerificationStatus.APPROVED
  ) {
    return {
      data: {
        status: found.status,
        message: "Email corporativo já confirmado.",
      },
    };
  }
  if (found.status !== CompanyVerificationStatus.PENDING) {
    return { error: jsonError("invalid_state", "Pedido não está elegível para confirmação.", 400) };
  }
  const updated = await companyVerificationRepository.markEmailVerified(String(found._id));
  if (!updated) return { error: jsonError("update_failed", "Não foi possível confirmar o email.", 500) };
  return {
    data: {
      status: updated.status,
      message: "Email corporativo confirmado. Aguarde aprovação de um administrador.",
    },
  };
}

/** @deprecated Use POST com JSON `{ "token" }` ou a página `/verificar-empresa`. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  if (!token) return jsonError("bad_request", "Token em falta.", 400);
  const base = new URL(request.url).origin;
  return NextResponse.redirect(new URL(`/verificar-empresa?token=${encodeURIComponent(token)}`, base));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "JSON inválido.", 400);
  }
  const token =
    typeof body === "object" && body !== null && "token" in body
      ? String((body as { token?: string }).token ?? "").trim()
      : "";
  if (!token) return jsonError("bad_request", "Token inválido.", 400);
  const result = await runConfirm(token);
  if ("error" in result && result.error) return result.error;
  return jsonData(result.data);
}
