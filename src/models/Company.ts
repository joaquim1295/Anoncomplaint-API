import mongoose, { Schema } from "mongoose";

export interface CompanyDocument {
  _id: mongoose.Types.ObjectId;
  ownerUserId: string;
  name: string;
  website?: string | null;
  description?: string | null;
  created_at: Date;
}

const companySchema = new Schema<CompanyDocument>(
  {
    ownerUserId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 160 },
    website: { type: String, required: false, default: null, maxlength: 240 },
    description: { type: String, required: false, default: null, maxlength: 600 },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "companies", timestamps: false }
);

companySchema.index({ ownerUserId: 1, created_at: -1 });

export const CompanyModel =
  (mongoose.models?.Company as mongoose.Model<CompanyDocument>) ??
  mongoose.model<CompanyDocument>("Company", companySchema);

