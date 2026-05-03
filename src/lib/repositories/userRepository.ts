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
  email_verified?: boolean;
  email_verify_token?: string | null;
  email_verify_expires?: Date | null;
}): Promise<UserDocument> {
  await getConnection();
  const doc = await UserModel.create(data);
  return doc.toObject() as UserDocument;
}

export async function findAll(options: { limit?: number } = {}): Promise<UserDocument[]> {
  const limit = Math.min(5000, Math.max(1, options.limit ?? 500));
  await getConnection();
  const docs = await UserModel.find({}).sort({ created_at: -1 }).limit(limit).lean();
  return docs as UserDocument[];
}

export async function findByUsername(username: string): Promise<UserDocument | null> {
  await getConnection();
  const doc = await UserModel.findOne({ username }).lean();
  return doc as UserDocument | null;
}

export async function findByEmail(email: string): Promise<UserDocument | null> {
  await getConnection();
  const doc = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean();
  return doc as UserDocument | null;
}

export async function findByEmailOrUsername(
  emailOrUsername: string
): Promise<UserDocument | null> {
  await getConnection();
  const doc = await UserModel.findOne({
    $or: [{ email: emailOrUsername.toLowerCase().trim() }, { username: emailOrUsername }],
  }).lean();
  return doc as UserDocument | null;
}

export async function findUserById(id: string): Promise<UserDocument | null> {
  await getConnection();
  const doc = await UserModel.findById(id).lean();
  return doc as UserDocument | null;
}

export async function findUserByIds(ids: string[]): Promise<UserDocument[]> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter((id) => /^[a-f0-9]{24}$/i.test(id)))];
  if (unique.length === 0) return [];
  await getConnection();
  const docs = await UserModel.find({ _id: { $in: unique } }).lean();
  return docs as UserDocument[];
}

export async function findByPasswordResetToken(token: string): Promise<UserDocument | null> {
  await getConnection();
  const doc = await UserModel.findOne({
    password_reset_token: token,
    password_reset_expires: { $gt: new Date() },
  }).lean();
  return doc as UserDocument | null;
}

export async function findByEmailVerifyToken(token: string): Promise<UserDocument | null> {
  await getConnection();
  const doc = await UserModel.findOne({
    email_verify_token: token,
    email_verify_expires: { $gt: new Date() },
  }).lean();
  return doc as UserDocument | null;
}

export async function updateById(
  id: string,
  data: Partial<
    Omit<
      UserDocument,
      "_id" | "created_at" | "email" | "password_hash" | "salt" | "subscribedComplaints" | "followedTopics"
    >
  > & {
    password_hash?: string;
    salt?: string;
    subscribedComplaints?: string[];
    followedTopics?: string[];
  }
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
  const docs = await UserModel.find({
    subscribedComplaints: complaintId,
    banned_at: { $in: [null, undefined] },
    deleted_at: { $in: [null, undefined] },
  })
    .select({ email: 1, username: 1, created_at: 1 })
    .lean();
  return docs as UserDocument[];
}

export async function findUsersFollowingTopic(topicSlug: string): Promise<UserDocument[]> {
  await getConnection();
  const slug = topicSlug.toLowerCase().trim();
  const docs = await UserModel.find({
    followedTopics: slug,
    banned_at: { $in: [null, undefined] },
    deleted_at: { $in: [null, undefined] },
  })
    .select({ email: 1, username: 1 })
    .lean();
  return docs as UserDocument[];
}

export async function toggleTopicFollow(
  userId: string,
  topicSlug: string
): Promise<{ user: UserDocument | null; following: boolean }> {
  await getConnection();
  const slug = topicSlug.toLowerCase().trim();
  const user = await UserModel.findById(userId).select({ followedTopics: 1 }).lean<UserDocument | null>();
  if (!user) return { user: null, following: false };
  const has = (user.followedTopics ?? []).includes(slug);
  const update = has ? { $pull: { followedTopics: slug } } : { $addToSet: { followedTopics: slug } };
  const doc = await UserModel.findByIdAndUpdate(userId, update, { new: true }).lean<UserDocument | null>();
  return { user: doc, following: !has };
}
