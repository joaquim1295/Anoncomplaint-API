import mongoose, { Schema } from "mongoose";

export interface TopicDocument {
  _id: mongoose.Types.ObjectId;
  slug: string;
  title: string;
  description?: string | null;
  company_id?: string | null;
  complaint_count: number;
  created_at: Date;
}

const topicSchema = new Schema<TopicDocument>(
  {
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 80 },
    title: { type: String, required: true, maxlength: 120 },
    description: { type: String, required: false, default: null, maxlength: 500 },
    company_id: { type: String, required: false, default: null, index: true },
    complaint_count: { type: Number, default: 0, min: 0 },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "topics", timestamps: false }
);

topicSchema.index({ slug: 1 }, { unique: true });
topicSchema.index({ complaint_count: -1, created_at: -1 });

export const TopicModel =
  (mongoose.models?.Topic as mongoose.Model<TopicDocument>) ??
  mongoose.model<TopicDocument>("Topic", topicSchema);
