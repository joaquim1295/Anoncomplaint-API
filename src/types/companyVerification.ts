export enum CompanyVerificationStatus {
  PENDING = "pending",
  EMAIL_VERIFIED = "email_verified",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface CompanyVerificationRequest {
  id: string;
  userId: string;
  email: string;
  companyName: string;
  companyWebsite: string;
  contactName: string;
  status: CompanyVerificationStatus;
  expiresAt: Date;
  emailVerifiedAt?: Date | null;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  created_at: Date;
}

