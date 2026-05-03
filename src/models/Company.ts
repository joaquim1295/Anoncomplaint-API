import mongoose, { Schema } from "mongoose";

export interface CompanyDocument {
  _id: mongoose.Types.ObjectId;
  ownerUserId: string;
  name: string;
  slug: string;
  logo_image?: string | null;
  taxId?: string | null;
  website?: string | null;
  description?: string | null;
  views_count: number;
  created_at: Date;
}

const companySchema = new Schema<CompanyDocument>(
  {
    ownerUserId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 160 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    logo_image: { type: String, required: false, default: null, maxlength: 2_000_000 },
    taxId: { type: String, required: false, default: null, maxlength: 40 },
    website: { type: String, required: false, default: null, maxlength: 240 },
    description: { type: String, required: false, default: null, maxlength: 600 },
    views_count: { type: Number, default: 0, min: 0 },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "companies", timestamps: false }
);

companySchema.index({ ownerUserId: 1, created_at: -1 });
companySchema.index({ slug: 1 }, { unique: true });
companySchema.index({ views_count: -1, created_at: -1 });
companySchema.index({ name: "text" });

export const CompanyModel =
  (mongoose.models?.Company as mongoose.Model<CompanyDocument>) ??
  mongoose.model<CompanyDocument>("Company", companySchema);

