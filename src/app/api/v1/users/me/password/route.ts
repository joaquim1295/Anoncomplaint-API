import { z } from "zod";
import { requireApiAuth } from "../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../lib/api/http";
import * as authService from "../../../../../../lib/authService";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
  confirmPassword: z.string().min(1),
}).refine((v) => v.newPassword === v.confirmPassword, {
  message: "As passwords não coincidem",
  path: ["confirmPassword"],
});

export async function PATCH(request: Request) {
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
  const result = await authService.updatePassword(
    auth.session.userId,
    parsed.data.currentPassword,
    parsed.data.newPassword
  );
  if (!result.success) return jsonError("update_failed", result.error, 400);
  return jsonData({ success: true });
}

