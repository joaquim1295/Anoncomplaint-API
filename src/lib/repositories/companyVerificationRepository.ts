import { getConnection } from "../db";
import {
  CompanyVerificationRequestModel,
  type CompanyVerificationRequestDocument,
} from "../../models/CompanyVerificationRequest";
import { CompanyVerificationStatus } from "../../types/companyVerification";

export async function create(data: {
  userId: string;
  email: string;
  companyName: string;
  companyWebsite: string;
  contactName: string;
  emailVerificationToken: string;
  expiresAt: Date;
}): Promise<CompanyVerificationRequestDocument> {
  await getConnection();
  const doc = await CompanyVerificationRequestModel.create({
    ...data,
    status: CompanyVerificationStatus.PENDING,
  });
  return doc.toObject() as CompanyVerificationRequestDocument;
}

export async function findLatestByUserId(
  userId: string
): Promise<CompanyVerificationRequestDocument | null> {
  await getConnection();
  const doc = await CompanyVerificationRequestModel.findOne({ userId })
    .sort({ created_at: -1 })
    .lean();
  return doc as CompanyVerificationRequestDocument | null;
}

export async function findByToken(
  token: string
): Promise<CompanyVerificationRequestDocument | null> {
  await getConnection();
  const doc = await CompanyVerificationRequestModel.findOne({
    emailVerificationToken: token,
  }).lean();
  return doc as CompanyVerificationRequestDocument | null;
}

export async function markEmailVerified(
  id: string
): Promise<CompanyVerificationRequestDocument | null> {
  await getConnection();
  const doc = await CompanyVerificationRequestModel.findByIdAndUpdate(
    id,
    {
      $set: {
        status: CompanyVerificationStatus.EMAIL_VERIFIED,
        emailVerifiedAt: new Date(),
        updated_at: new Date(),
      },
    },
    { new: true }
  ).lean();
  return doc as CompanyVerificationRequestDocument | null;
}

export async function listPendingForAdmin(): Promise<CompanyVerificationRequestDocument[]> {
  await getConnection();
  const docs = await CompanyVerificationRequestModel.find({
    status: { $in: [CompanyVerificationStatus.PENDING, CompanyVerificationStatus.EMAIL_VERIFIED] },
  })
    .sort({ created_at: 1 })
    .lean();
  return docs as CompanyVerificationRequestDocument[];
}

export async function findById(
  id: string
): Promise<CompanyVerificationRequestDocument | null> {
  await getConnection();
  const doc = await CompanyVerificationRequestModel.findById(id).lean();
  return doc as CompanyVerificationRequestDocument | null;
}

export async function markApproved(
  id: string,
  adminUserId: string
): Promise<CompanyVerificationRequestDocument | null> {
  await getConnection();
  const doc = await CompanyVerificationRequestModel.findByIdAndUpdate(
    id,
    {
      $set: {
        status: CompanyVerificationStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedBy: adminUserId,
        updated_at: new Date(),
      },
    },
    { new: true }
  ).lean();
  return doc as CompanyVerificationRequestDocument | null;
}

export async function markRejected(
  id: string,
  adminUserId: string
): Promise<CompanyVerificationRequestDocument | null> {
  await getConnection();
  const doc = await CompanyVerificationRequestModel.findByIdAndUpdate(
    id,
    {
      $set: {
        status: CompanyVerificationStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedBy: adminUserId,
        updated_at: new Date(),
      },
    },
    { new: true }
  ).lean();
  return doc as CompanyVerificationRequestDocument | null;
}

