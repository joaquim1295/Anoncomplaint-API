import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();
  const paths = [
    "",
    "/login",
    "/register",
    "/pesquisa",
    "/topicos",
    "/mapa",
    "/api-docs",
    "/activities",
    "/perfil",
    "/inbox",
    "/notificacoes",
  ];
  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? ("daily" as const) : ("weekly" as const),
    priority: path === "" ? 1 : 0.6,
  }));
}
