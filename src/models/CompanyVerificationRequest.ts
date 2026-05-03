import mongoose, { Schema } from "mongoose";
import { CompanyVerificationStatus } from "../types/companyVerification";

export interface CompanyVerificationRequestDocument {
  _id: mongoose.Types.ObjectId;
  userId: string;
  email: string;
  companyName: string;
  companyWebsite: string;
  contactName: string;
  status: CompanyVerificationStatus;
  emailVerificationToken: string;
  expiresAt: Date;
  emailVerifiedAt?: Date | null;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  created_at: Date;
  updated_at: Date;
}

const schema = new Schema<CompanyVerificationRequestDocument>(
  {
    userId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    companyName: { type: String, required: true, trim: true, maxlength: 180 },
    companyWebsite: { type: String, required: true, trim: true, maxlength: 250 },
    contactName: { type: String, required: true, trim: true, maxlength: 120 },
    status: {
      type: String,
      enum: Object.values(CompanyVerificationStatus),
      default: CompanyVerificationStatus.PENDING,
      index: true,
    },
    emailVerificationToken: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    emailVerifiedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: String, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "company_verification_requests", timestamps: false }
);

schema.index({ companyWebsite: 1, status: 1 });
schema.index({ status: 1, created_at: 1 });
schema.index({ userId: 1, created_at: -1 });

schema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export const CompanyVerificationRequestModel =
  (mongoose.models?.CompanyVerificationRequest as mongoose.Model<CompanyVerificationRequestDocument>) ??
  mongoose.model<CompanyVerificationRequestDocument>("CompanyVerificationRequest", schema);

