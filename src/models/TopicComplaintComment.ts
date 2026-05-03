import mongoose, { Schema } from "mongoose";

export interface TopicComplaintCommentDocument {
  _id: mongoose.Types.ObjectId;
  complaintId: mongoose.Types.ObjectId;
  topicSlug: string;
  authorUserId: string;
  authorLabel: string;
  content: string;
  createdAt: Date;
}

const topicComplaintCommentSchema = new Schema<TopicComplaintCommentDocument>(
  {
    complaintId: { type: Schema.Types.ObjectId, ref: "Complaint", required: true, index: true },
    topicSlug: { type: String, required: true, maxlength: 80, index: true },
    authorUserId: { type: String, required: true, maxlength: 32 },
    authorLabel: { type: String, required: true, maxlength: 120 },
    content: { type: String, required: true, maxlength: 600 },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "topic_complaint_comments", timestamps: false }
);

topicComplaintCommentSchema.index({ complaintId: 1, topicSlug: 1, createdAt: -1 });

export const TopicComplaintCommentModel =
  (mongoose.models?.TopicComplaintComment as mongoose.Model<TopicComplaintCommentDocument>) ??
  mongoose.model<TopicComplaintCommentDocument>("TopicComplaintComment", topicComplaintCommentSchema);
