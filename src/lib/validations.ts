import { z } from "zod";
import { ComplaintStatus } from "../types/complaint";

const objectIdSchema = z.string().min(24).max(24).regex(/^[a-f0-9]{24}$/i, "ID inválido");

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
    content: z.string().min(10, "Mínimo 10 caracteres").max(2000),
    tags: z.array(z.string().min(1).max(50)).max(10).default([]),
    ghost_mode: z.boolean().default(true),
    location_city: z
      .string()
      .max(120)
      .transform((v) => v.trim())
      .optional()
      .default(""),
    location_lat: optionalNumberInRange({ min: -90, max: 90 }).optional(),
    location_lng: optionalNumberInRange({ min: -180, max: 180 }).optional(),
  })
  .superRefine((v, ctx) => {
    const city = (v.location_city ?? "").trim();
    const lat = v.location_lat;
    const lng = v.location_lng;
    const any = Boolean(city) || lat !== undefined || lng !== undefined;
    if (!any) return;
    if (!city) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Cidade obrigatória", path: ["location_city"] });
    if (lat === undefined || Number.isNaN(lat)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Latitude inválida", path: ["location_lat"] });
    if (lng === undefined || Number.isNaN(lng)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Longitude inválida", path: ["location_lng"] });
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