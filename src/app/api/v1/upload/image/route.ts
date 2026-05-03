import { z } from "zod";
import { getApiSession } from "../../../../../lib/api/auth";
import { jsonData, jsonError } from "../../../../../lib/api/http";
import {
  approxBytesFromDataUri,
  isCloudinaryConfigured,
  isDataImageUri,
  uploadDataUriImage,
} from "../../../../../lib/media/cloudinary";
import { getClientIp, imageUploadLimiter, rateLimitOrNull } from "../../../../../lib/rate-limit";

const bodySchema = z.object({
  image: z.string().min(30).max(6_000_000),
  folder: z.enum(["complaints", "profiles"]).default("complaints"),
});

export async function POST(request: Request) {
  const limited = await rateLimitOrNull(imageUploadLimiter, getClientIp(request), "imageUpload");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("bad_request", "JSON inválido", 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation_error", "Payload inválido", 400, parsed.error.flatten());
  }

  const { image, folder } = parsed.data;

  const session = await getApiSession(request);
  if (folder === "profiles") {
    if (!session) return jsonError("unauthorized", "Inicie sessão para alterar a foto de perfil.", 401);
  } else if (folder === "complaints") {
    if (!session) return jsonError("unauthorized", "Inicie sessão para anexar imagens à denúncia.", 401);
  }

  if (!isDataImageUri(image)) {
    return jsonError("validation_error", "Use uma imagem em base64 (data:image/png|jpeg|webp|gif).", 400);
  }
  if (approxBytesFromDataUri(image) > 4 * 1024 * 1024) {
    return jsonError("validation_error", "Imagem demasiado grande (máx. 4 MB).", 400);
  }

  if (!isCloudinaryConfigured()) {
    return jsonError(
      "service_unavailable",
      "Armazenamento cloud não configurado. Defina CLOUDINARY_URL ou credenciais Cloudinary.",
      503
    );
  }

  try {
    const url = await uploadDataUriImage(image, folder, {
      profileUserId: folder === "profiles" && session ? session.userId : undefined,
    });
    return jsonData({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha no upload";
    const details =
      e instanceof Error
        ? {
            name: e.name,
            ...(process.env.NODE_ENV !== "production" ? { stack: e.stack } : {}),
          }
        : { raw: String(e) };
    return jsonError("upload_failed", msg, 400, details);
  }
}
