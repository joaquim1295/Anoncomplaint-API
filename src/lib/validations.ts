import { z } from "zod";
import { ComplaintStatus } from "../types/complaint";

/** Mensagem única para API/cliente a partir de issues Zod. */
export function formatZodIssuesForClient(issues: z.ZodIssue[]): string {
  return issues
    .map((i) => `${i.path.length ? i.path.join(".") : "body"}: ${i.message}`)
    .join(" | ");
}

const objectIdSchema = z
  .string()
  .min(24)
  .max(24)
  .regex(/^[a-f0-9]{24}$/i, "complaintForm.validation.invalidId");

function optionalNumberInRange(options: { min: number; max: number }) {
  return z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    if (typeof v === "number" && Number.isNaN(v)) return undefined;
    if (typeof v === "string") return Number(v);
    return v;
  }, z.number().min(options.min).max(options.max).optional());
}

export const createComplaintSchema = z
  .object({
    title: z.preprocess(
      (v) => String(v ?? "").trim(),
      z.string().min(1, "complaintForm.validation.titleRequired").max(100, "complaintForm.validation.titleMax100")
    ),
    company_id: z.preprocess((v) => {
      if (v === "" || v === null || v === undefined) return undefined;
      const s = String(v).trim();
      return s === "" ? undefined : s;
    }, objectIdSchema.optional()),
    content: z.preprocess(
      (v) => String(v ?? ""),
      z.string().min(10, "complaintForm.validation.contentMin10").max(2000, "complaintForm.validation.contentMax2000")
    ),
    attachments: z.preprocess((v) => {
      if (Array.isArray(v)) return v.map((x) => String(x ?? "").trim()).filter(Boolean);
      if (typeof v === "string" && v.trim()) return [v.trim()];
      return [];
    }, z.array(z.string().max(2_000_000)).max(4).default([])),
    tags: z.preprocess((v) => {
      if (Array.isArray(v)) return v.map((x) => String(x ?? "").trim()).filter(Boolean);
      if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
      return [];
    }, z.array(z.string().min(1).max(50)).max(10).default([])),
    ghost_mode: z.preprocess((v) => {
      if (v === true || v === "true" || v === 1 || v === "1") return true;
      if (v === false || v === "false" || v === 0 || v === "0") return false;
      return true;
    }, z.boolean().default(true)),
    location_city: z
      .preprocess((v) => String(v ?? "").trim(), z.string().max(120).optional().default("")),
    location_lat: optionalNumberInRange({ min: -90, max: 90 }).optional(),
    location_lng: optionalNumberInRange({ min: -180, max: 180 }).optional(),
    topic_slug: z.preprocess((v) => {
      if (v == null || v === "") return undefined;
      const s = String(v).replace(/^#/, "").trim().toLowerCase();
      return s === "" ? undefined : s;
    }, z.string().max(80).optional()),
  })
  .superRefine((v, ctx) => {
    const city = (v.location_city ?? "").trim();
    const latRaw = v.location_lat;
    const lngRaw = v.location_lng;
    const lat = latRaw !== undefined && typeof latRaw === "number" && !Number.isNaN(latRaw) ? latRaw : undefined;
    const lng = lngRaw !== undefined && typeof lngRaw === "number" && !Number.isNaN(lngRaw) ? lngRaw : undefined;
    const any = Boolean(city) || lat !== undefined || lng !== undefined;
    if (!any) return;
    if (!city) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "complaintForm.validation.cityRequired", path: ["location_city"] });
    if (lat === undefined)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "complaintForm.validation.latitudeInvalid", path: ["location_lat"] });
    if (lng === undefined)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "complaintForm.validation.longitudeInvalid", path: ["location_lng"] });
  })
  .superRefine((v, ctx) => {
    const slug = v.topic_slug;
    if (!slug) return;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "complaintForm.validation.topicSlugInvalid",
        path: ["topic_slug"],
      });
    }
  });

export const updateComplaintStatusSchema = z.object({
  complaint_id: objectIdSchema,
  status: z.nativeEnum(ComplaintStatus),
});

export const complaintIdSchema = z.object({
  id: objectIdSchema,
});

export const officialResponseSchema = z.object({
  complaint_id: objectIdSchema,
  company_id: objectIdSchema,
  content: z.string().min(10, "Mínimo 10 caracteres").max(2000),
});

export const updateUsernameSchema = z.object({
  username: z.string().min(1, "Username obrigatório").max(50).trim(),
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password atual obrigatória"),
    newPassword: z.string().min(8, "Nova password: mínimo 8 caracteres").max(128),
    confirmPassword: z.string().min(1, "Confirme a nova password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As passwords não coincidem",
    path: ["confirmPassword"],
  });

export const createCompanySchema = z.object({
  name: z.string().min(2, "Nome obrigatório").max(160),
  website: z
    .string()
    .max(240)
    .url("URL inválido")
    .optional()
    .or(
      z
        .string()
        .max(240)
        .trim()
        .length(0)
        .transform(() => undefined)
    ),
  description: z
    .string()
    .max(600)
    .optional()
    .or(
      z
        .string()
        .max(600)
        .trim()
        .length(0)
        .transform(() => undefined)
    ),
});

export const updateCompanySchema = createCompanySchema.extend({
  id: objectIdSchema,
});

export const companyIdSchema = z.object({
  id: objectIdSchema,
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type UpdateComplaintStatusInput = z.infer<typeof updateComplaintStatusSchema>;
export type ComplaintIdInput = z.infer<typeof complaintIdSchema>;
export type UpdateUsernameInput = z.infer<typeof updateUsernameSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type OfficialResponseInput = z.infer<typeof officialResponseSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CompanyIdInput = z.infer<typeof companyIdSchema>;