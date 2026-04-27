import { getConnection } from "../db";
import { UserModel } from "../../models/User";
import type { UserDocument } from "../../models/User";
import type { UserRole } from "../../types/user";

export async function create(data: {
  email: string;
  username?: string;
  password_hash: string;
  salt: string;
  role?: import("../../types/user").UserRole;
}): Promise<UserDocument> {
  await getConnection();
  const doc = await UserModel.create(data);
  return doc.toObject() as UserDocument;
}

export async function findAll(): Promise<UserDocument[]> {
  await getConnection();
  const docs = await UserModel.find({})
    .sort({ created_at: -1 })
    .lean();
  return docs as UserDocument[];
}

export async function findByUsername(username: string): Promise<UserDocument | null> {
  await getConnection();
  const doc = await UserModel.findOne({ username }).lean();
  return doc as UserDocument | null;
}

export async function findByEmailOrUsername(
  emailOrUsername: string
): Promise<UserDocument | null> {
  await getConnection();
  const doc = await UserModel.findOne({
    $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
  }).lean();
  return doc as UserDocument | null;
}

export async function findUserById(id: string): Promise<UserDocument | null> {
  await getConnection();
  const doc = await UserModel.findById(id).lean();
  return doc as UserDocument | null;
}

export async function updateById(
  id: string,
  data: Partial<Pick<UserDocument, "username" | "password_hash" | "salt" | "role" | "banned_at" | "subscribedComplaints">>
): Promise<UserDocument | null> {
  await getConnection();
  const doc = await UserModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  return doc as UserDocument | null;
}

export async function setBannedAt(
  id: string,
  bannedAt: Date | null
): Promise<UserDocument | null> {
  return updateById(id, { banned_at: bannedAt });
}

export async function setRole(
  id: string,
  role: UserRole
): Promise<UserDocument | null> {
  return updateById(id, { role });
}

export async function toggleComplaintSubscription(
  userId: string,
  complaintId: string
): Promise<{ user: UserDocument | null; subscribed: boolean }> {
  await getConnection();
  const user = await UserModel.findById(userId).select({ subscribedComplaints: 1 }).lean<UserDocument | null>();
  if (!user) return { user: null, subscribed: false };
  const has = (user.subscribedComplaints ?? []).includes(complaintId);
  const update = has
    ? { $pull: { subscribedComplaints: complaintId } }
    : { $addToSet: { subscribedComplaints: complaintId } };
  const doc = await UserModel.findByIdAndUpdate(userId, update, { new: true }).lean<UserDocument | null>();
  return { user: doc, subscribed: !has };
}

export async function getSubscribedUsersForComplaint(
  complaintId: string
): Promise<UserDocument[]> {
  await getConnection();
  const docs = await UserModel.find({ subscribedComplaints: complaintId, banned_at: { $in: [null, undefined] } })
    .select({ email: 1, username: 1, created_at: 1 })
    .lean();
  return docs as UserDocument[];
}
