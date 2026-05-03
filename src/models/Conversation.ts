import mongoose, { Schema } from "mongoose";

export interface ConversationDocument {
  _id: mongoose.Types.ObjectId;
  userId: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date | null;
}

const conversationSchema = new Schema<ConversationDocument>(
  {
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastMessageAt: { type: Date, default: null },
  },
  { collection: "conversations", timestamps: false }
);

conversationSchema.index({ userId: 1, companyId: 1 }, { unique: true });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ companyId: 1, lastMessageAt: -1 });

export const ConversationModel =
  (mongoose.models?.Conversation as mongoose.Model<ConversationDocument>) ??
  mongoose.model<ConversationDocument>("Conversation", conversationSchema);
