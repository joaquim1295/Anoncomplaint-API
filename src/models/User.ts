import mongoose, { Schema } from "mongoose";
import { UserRole } from "../types/user";

export interface UserDocument {
  _id: mongoose.Types.ObjectId;
  email: string;
  username?: string;
  password_hash: string;
  salt: string;
  role: UserRole;
  banned_at?: Date | null;
  subscribedComplaints: string[];
  created_at: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: false, sparse: true },
    password_hash: { type: String, required: true },
    salt: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    banned_at: { type: Date, required: false, default: null },
    subscribedComplaints: { type: [String], default: [] },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "users", timestamps: false }
);

export const UserModel =
  (mongoose.models?.User as mongoose.Model<UserDocument>) ??
  mongoose.model<UserDocument>("User", userSchema);
