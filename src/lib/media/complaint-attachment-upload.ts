/**
 * Upload de imagem (data URI) para Cloudinary via API interna.
 * Em dev sem CLOUDINARY, o servidor devolve 503 e o cliente pode usar o base64 original.
 */
export type UploadImageResult =
  | { status: "ok"; url: string }
  | { status: "fallback" }
  | { status: "error"; message: string };

export async function uploadComplaintImageDataUri(dataUri: string): Promise<UploadImageResult> {
  const res = await fetch("/api/v1/upload/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ image: dataUri, folder: "complaints" }),
  });
  const json = await res.json().catch(() => null);
  if (res.ok && json?.data?.url && typeof json.data.url === "string") {
    return { status: "ok", url: json.data.url };
  }
  if (res.status === 503) {
    return { status: "fallback" };
  }
  const base =
    json?.error?.message ?? (res.status === 429 ? "Demasiados uploads. Tente mais tarde." : "Falha no upload");
  const det = json?.error?.details != null ? ` ${JSON.stringify(json.error.details)}` : "";
  return { status: "error", message: base + det };
}

export async function normalizeComplaintAttachments(items: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const raw of items) {
    const s = String(raw ?? "").trim();
    if (!s) continue;
    if (s.startsWith("data:image")) {
      const r = await uploadComplaintImageDataUri(s);
      if (r.status === "ok") {
        out.push(r.url);
      } else if (r.status === "fallback") {
        out.push(s);
      } else {
        throw new Error(r.message);
      }
    } else {
      out.push(s);
    }
    if (out.length >= 4) break;
  }
  return out.slice(0, 4);
}
