import mongoose, { Schema } from "mongoose";

export interface NotificationDocument {
  _id: mongoose.Types.ObjectId;
  userId: string;
  title: string;
  message: string;
  complaintId?: string | null;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    complaintId: { type: String, required: false, default: null },
    isRead: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "notifications", timestamps: false }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel =
  (mongoose.models?.Notification as mongoose.Model<NotificationDocument>) ??
  mongoose.model<NotificationDocument>("Notification", notificationSchema);
