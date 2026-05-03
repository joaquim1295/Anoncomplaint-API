import mongoose, { Schema } from "mongoose";

export type MessageSenderRole = "user" | "company";

export interface DirectMessageDocument {
  _id: mongoose.Types.ObjectId;
  conversationId: string;
  senderUserId: string;
  senderRole: MessageSenderRole;
  content: string;
  createdAt: Date;
  readByUser: boolean;
  readByCompany: boolean;
}

const directMessageSchema = new Schema<DirectMessageDocument>(
  {
    conversationId: { type: String, required: true, index: true },
    senderUserId: { type: String, required: true },
    senderRole: { type: String, enum: ["user", "company"], required: true },
    content: { type: String, required: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now, index: true },
    readByUser: { type: Boolean, required: true, default: false },
    readByCompany: { type: Boolean, required: true, default: false },
  },
  { collection: "direct_messages", timestamps: false }
);

directMessageSchema.index({ conversationId: 1, createdAt: -1 });
directMessageSchema.index({ conversationId: 1, senderRole: 1, readByUser: 1 });
directMessageSchema.index({ conversationId: 1, senderRole: 1, readByCompany: 1 });

export const DirectMessageModel =
  (mongoose.models?.DirectMessage as mongoose.Model<DirectMessageDocument>) ??
  mongoose.model<DirectMessageDocument>("DirectMessage", directMessageSchema);
