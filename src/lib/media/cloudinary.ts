import type { v2 as CloudinaryV2 } from "cloudinary";

/**
 * O SDK Node valida `process.env.CLOUDINARY_URL` e exige protocolo `cloudinary://`.
 * Se tiveres um URL `https://...` (comum por engano) mas também CLOUDINARY_CLOUD_NAME + chaves,
 * é preciso não deixar o SDK ler o URL inválido — ver `runWithCloudinaryConfig`.
 */
function configureCloudinary(cloudinary: typeof CloudinaryV2): void {
  const url = process.env.CLOUDINARY_URL?.trim() ?? "";
  if (url.startsWith("cloudinary://")) {
    cloudinary.config();
    return;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    if (url && !url.startsWith("cloudinary://")) {
      throw new Error(
        "CLOUDINARY_URL inválido (tem de começar por cloudinary://). Corrige o URL ou remove-o e define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET."
      );
    }
    throw new Error("Cloudinary não configurado: defina CLOUDINARY_URL (cloudinary://...) ou CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.");
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/** Executa `fn` sem `CLOUDINARY_URL` inválido no ambiente (evita erro do SDK com URLs https). */
async function runWithCloudinaryConfig<T>(cloudinary: typeof CloudinaryV2, fn: () => Promise<T>): Promise<T> {
  const rawUrl = process.env.CLOUDINARY_URL?.trim() ?? "";
  const hadInvalidProtocol = Boolean(rawUrl && !rawUrl.startsWith("cloudinary://"));
  if (hadInvalidProtocol) {
    delete process.env.CLOUDINARY_URL;
  }
  try {
    configureCloudinary(cloudinary);
    return await fn();
  } finally {
    if (hadInvalidProtocol) {
      process.env.CLOUDINARY_URL = rawUrl;
    }
  }
}

export function isCloudinaryConfigured(): boolean {
  const url = process.env.CLOUDINARY_URL?.trim() ?? "";
  if (url.startsWith("cloudinary://")) return true;
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim()
  );
}

const DATA_IMAGE_RE = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i;

export function isDataImageUri(value: string): boolean {
  return DATA_IMAGE_RE.test(value.trim());
}

/** Valida magic bytes do payload base64 (mitiga MIME falso). */
export function assertDataUriImageMagic(dataUri: string): void {
  const trimmed = dataUri.trim();
  const m = trimmed.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/i);
  if (!m) throw new Error("Formato de imagem inválido.");
  const b64 = m[2]?.replace(/\s/g, "") ?? "";
  let buf: Buffer;
  try {
    buf = Buffer.from(b64, "base64");
  } catch {
    throw new Error("Base64 inválido.");
  }
  if (buf.length < 12) throw new Error("Ficheiro demasiado pequeno.");
  const mime = m[1].toLowerCase();
  const b0 = buf[0]!;
  const b1 = buf[1]!;
  const b2 = buf[2]!;
  const b3 = buf[3]!;
  if (mime === "png" && (b0 !== 0x89 || b1 !== 0x50 || b2 !== 0x4e || b3 !== 0x47)) {
    throw new Error("Assinatura PNG inválida.");
  }
  if ((mime === "jpeg" || mime === "jpg") && (b0 !== 0xff || b1 !== 0xd8 || b2 !== 0xff)) {
    throw new Error("Assinatura JPEG inválida.");
  }
  if (mime === "gif" && (b0 !== 0x47 || b1 !== 0x49 || b2 !== 0x46 || b3 !== 0x38)) {
    throw new Error("Assinatura GIF inválida.");
  }
  if (mime === "webp") {
    const riff = buf.subarray(0, 4).toString("ascii");
    const webp = buf.subarray(8, 12).toString("ascii");
    if (riff !== "RIFF" || webp !== "WEBP") throw new Error("Assinatura WebP inválida.");
  }
}

/** Tamanho aproximado em bytes do payload base64 (data URI). */
export function approxBytesFromDataUri(dataUri: string): number {
  const idx = dataUri.indexOf("base64,");
  if (idx === -1) return dataUri.length;
  const b64 = dataUri.slice(idx + 7);
  return Math.floor((b64.length * 3) / 4);
}

const MAX_BYTES = 4 * 1024 * 1024;

export async function uploadDataUriImage(
  dataUri: string,
  folder: "complaints" | "profiles",
  options?: { profileUserId?: string }
): Promise<string> {
  const trimmed = dataUri.trim();
  if (!isDataImageUri(trimmed)) {
    throw new Error("Apenas imagens PNG, JPEG, GIF ou WebP em base64 são aceites.");
  }
  assertDataUriImageMagic(trimmed);
  if (approxBytesFromDataUri(trimmed) > MAX_BYTES) {
    throw new Error("Imagem demasiado grande (máx. 4 MB).");
  }
  const { v2: cloudinary } = await import("cloudinary");
  const cloudFolder =
    folder === "profiles" && options?.profileUserId
      ? `smartcomplaint/profiles/${options.profileUserId}`
      : `smartcomplaint/${folder}`;
  const uploaded = await runWithCloudinaryConfig(cloudinary, () =>
    cloudinary.uploader.upload(trimmed, {
      folder: cloudFolder,
      resource_type: "image",
      overwrite: false,
    })
  );
  return uploaded.secure_url;
}
