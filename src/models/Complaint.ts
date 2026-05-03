import mongoose, { Schema } from "mongoose";
import { ComplaintStatus } from "../types/complaint";

export interface OfficialResponsePayload {
  id: string;
  companyId: string;
  companyOwnerUserId: string;
  companyName: string;
  companySlug?: string;
  content: string;
  createdAt: Date;
  replies?: OfficialResponseReplyPayload[];
}

export interface OfficialResponseReplyPayload {
  id: string;
  authorUserId: string;
  authorLabel: string;
  content: string;
  ai_summary?: string | null;
  parentReplyId?: string | null;
  createdAt: Date;
}

export interface ComplaintLocation {
  lat: number;
  lng: number;
  city: string;
}

export interface ComplaintDocument {
  _id: mongoose.Types.ObjectId;
  author_id: string | null;
  ghost_mode: boolean;
  title?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  companySlug?: string | null;
  content: string;
  attachments?: string[];
  ai_summary?: string | null;
  tags: string[];
  topic_slug?: string | null;
  topic_title?: string | null;
  status: ComplaintStatus;
  location?: ComplaintLocation | null;
  created_at: Date;
  updated_at: Date;
  /** Preenchido quando o autor altera título ou texto (transparência). */
  edited_at?: Date | null;
  endorsedBy: string[];
  officialResponses?: OfficialResponsePayload[];
  final_rating?: number | null;
}

const officialResponseReplySchema = new Schema<OfficialResponseReplyPayload>(
  {
    id: { type: String, required: true },
    authorUserId: { type: String, required: true },
    authorLabel: { type: String, required: true },
    content: { type: String, required: true },
    ai_summary: { type: String, required: false, default: null, maxlength: 320 },
    parentReplyId: { type: String, required: false, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const officialResponseSchema = new Schema<OfficialResponsePayload>(
  {
    id: { type: String, required: true },
    companyId: { type: String, required: true },
    companyOwnerUserId: { type: String, required: true },
    companyName: { type: String, required: true },
    companySlug: { type: String, required: false, default: null },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    replies: { type: [officialResponseReplySchema], default: [] },
  },
  { _id: false }
);

const complaintLocationSchema = new Schema<ComplaintLocation>(
  {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    city: { type: String, required: true, maxlength: 120 },
  },
  { _id: false }
);

const complaintSchema = new Schema<ComplaintDocument>(
  {
    author_id: { type: String, required: false, default: null },
    ghost_mode: { type: Boolean, default: true },
    title: { type: String, required: false, default: "", maxlength: 100 },
    companyId: { type: String, required: false, default: null },
    companyName: { type: String, required: false, default: null, maxlength: 160 },
    companySlug: { type: String, required: false, default: null, maxlength: 120 },
    content: { type: String, required: true },
    attachments: { type: [String], default: [] },
    /** Resumo IA ao nível da denúncia (persistido). */
    ai_summary: { type: String, required: false, default: null, maxlength: 2000 },
    tags: { type: [String], default: [] },
    topic_slug: { type: String, required: false, default: null, maxlength: 80, index: true },
    topic_title: { type: String, required: false, default: null, maxlength: 120 },
    endorsedBy: { type: [String], default: [] },
    officialResponses: { type: [officialResponseSchema], required: false, default: [] },
    final_rating: { type: Number, required: false, default: null, min: 0, max: 10 },
    location: { type: complaintLocationSchema, required: false, default: null },
    status: {
      type: String,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.PENDING,
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    edited_at: { type: Date, required: false, default: null },
  },
  { collection: "complaints", timestamps: false }
);

complaintSchema.index({ created_at: -1 });
complaintSchema.index({ author_id: 1, created_at: -1 });
complaintSchema.index({ status: 1, created_at: -1 });
complaintSchema.index({ topic_slug: 1, created_at: -1 });
complaintSchema.index({ companyId: 1, created_at: -1 });
complaintSchema.index({ "officialResponses.companyId": 1, created_at: -1 });
complaintSchema.index({ "location.city": 1, created_at: -1 });
complaintSchema.index({ "officialResponses.companyOwnerUserId": 1, created_at: -1 });
complaintSchema.index({ title: "text", content: "text", tags: "text" });

complaintSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export const ComplaintModel =
  (mongoose.models?.Complaint as mongoose.Model<ComplaintDocument>) ??
  mongoose.model<ComplaintDocument>("Complaint", complaintSchema);
