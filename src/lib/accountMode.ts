import { cookies } from "next/headers";
import type { Company } from "../types/company";
import { getCurrentUser } from "./getUser";
import * as companyService from "./companyService";

/** Cookie HttpOnly definido por `POST /api/v1/account/mode`. */
export const ACCOUNT_MODE_COOKIE = "sc_account_mode";

export type AccountMode = "personal" | "company";

export type ResolvedAccountContext =
  | {
      user: null;
      mode: "personal";
      canCompanyMode: false;
      companyCount: 0;
      companies: readonly [];
    }
  | {
      user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
      mode: AccountMode;
      canCompanyMode: boolean;
      companyCount: number;
      companies: Company[];
    };

/**
 * Modo de conta efectivo: `company` só se existir pelo menos uma empresa
 * associada ao utilizador (dono no perfil), independentemente do `role`.
 */
export async function getResolvedAccountMode(): Promise<ResolvedAccountContext> {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, mode: "personal", canCompanyMode: false, companyCount: 0, companies: [] };
  }
  const companies = await companyService.listForUser(user.userId);
  const canCompanyMode = companies.length > 0;
  const cookieStore = await cookies();
  const raw = cookieStore.get(ACCOUNT_MODE_COOKIE)?.value;
  let mode: AccountMode = raw === "company" ? "company" : "personal";
  if (!canCompanyMode) mode = "personal";
  return { user, mode, canCompanyMode, companyCount: companies.length, companies };
}
