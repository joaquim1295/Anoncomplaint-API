import { z } from "zod";
import { requireApiAuth } from "../../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../../lib/api/http";
import * as authService from "../../../../../../lib/authService";
import { isCloudinaryConfigured, isDataImageUri, uploadDataUriImage } from "../../../../../../lib/media/cloudinary";

const schema = z.object({
  username: z.string().trim().min(1).max(50),
  profile_image: z.string().max(2_000_000).optional().nullable(),
  bio: z.string().trim().max(280).optional().nullable(),
  location: z.string().trim().max(80).optional().nullable(),
  website: z.string().trim().max(240).optional().nullable(),
  public_profile_enabled: z.boolean().optional(),
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

  let profileImage = parsed.data.profile_image ?? null;
  if (profileImage && isDataImageUri(profileImage) && isCloudinaryConfigured()) {
    try {
      profileImage = await uploadDataUriImage(profileImage, "profiles");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao enviar imagem";
      return jsonError("upload_failed", msg, 400);
    }
  }

  const result = await authService.updateUsername(auth.session.userId, parsed.data.username, profileImage, {
    bio: parsed.data.bio ?? null,
    location: parsed.data.location ?? null,
    website: parsed.data.website ?? null,
    public_profile_enabled: parsed.data.public_profile_enabled,
  });
  if (!result.success) return jsonError("update_failed", result.error, 400);
  return jsonData({
    id: String(result.user._id),
    username: result.user.username ?? null,
    profile_image: result.user.profile_image ?? null,
    bio: result.user.bio ?? null,
    location: result.user.location ?? null,
    website: result.user.website ?? null,
    public_profile_enabled: Boolean(result.user.public_profile_enabled),
  });
}

