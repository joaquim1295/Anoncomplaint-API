import mongoose, { Schema } from "mongoose";
import { UserRole } from "../types/user";

export interface UserDocument {
  _id: mongoose.Types.ObjectId;
  email: string;
  username?: string;
  profile_image?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  public_profile_enabled?: boolean;
  password_hash: string;
  salt: string;
  role: UserRole;
  banned_at?: Date | null;
  /** Conta encerrada pelo próprio — distinto de suspensão admin (`banned_at`). */
  deleted_at?: Date | null;
  /** Se `false`, o registo ainda não confirmou o email (QW-31). */
  email_verified?: boolean;
  email_verify_token?: string | null;
  email_verify_expires?: Date | null;
  password_reset_token?: string | null;
  password_reset_expires?: Date | null;
  subscribedComplaints: string[];
  /** Slugs de tópicos (/t/[slug]) que o utilizador segue. */
  followedTopics: string[];
  created_at: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: false, sparse: true },
    profile_image: { type: String, required: false, default: null, maxlength: 2_000_000 },
    bio: { type: String, required: false, default: null, maxlength: 280 },
    location: { type: String, required: false, default: null, maxlength: 80 },
    website: { type: String, required: false, default: null, maxlength: 240 },
    public_profile_enabled: { type: Boolean, required: true, default: false },
    password_hash: { type: String, required: true },
    salt: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    banned_at: { type: Date, required: false, default: null },
    deleted_at: { type: Date, required: false, default: null },
    email_verified: { type: Boolean, required: false, default: true },
    email_verify_token: { type: String, required: false, default: null },
    email_verify_expires: { type: Date, required: false, default: null },
    password_reset_token: { type: String, required: false, default: null },
    password_reset_expires: { type: Date, required: false, default: null },
    subscribedComplaints: { type: [String], default: [] },
    followedTopics: { type: [String], default: [] },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "users", timestamps: false }
);

userSchema.index({ created_at: -1 });
userSchema.index({ subscribedComplaints: 1 });
userSchema.index({ followedTopics: 1 });
userSchema.index({ password_reset_token: 1 }, { sparse: true });
userSchema.index({ email_verify_token: 1 }, { sparse: true });

export const UserModel =
  (mongoose.models?.User as mongoose.Model<UserDocument>) ??
  mongoose.model<UserDocument>("User", userSchema);
