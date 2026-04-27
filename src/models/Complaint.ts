import mongoose, { Schema } from "mongoose";
import { ComplaintStatus } from "../types/complaint";

export interface OfficialResponsePayload {
  companyId: string;
  content: string;
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
  content: string;
  tags: string[];
  status: ComplaintStatus;
  location?: ComplaintLocation | null;
  created_at: Date;
  updated_at: Date;
  endorsedBy: string[];
  officialResponse?: OfficialResponsePayload | null;
}

const officialResponseSchema = new Schema<OfficialResponsePayload>(
  {
    companyId: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
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
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    endorsedBy: { type: [String], default: [] },
    officialResponse: { type: officialResponseSchema, required: false, default: null },
    location: { type: complaintLocationSchema, required: false, default: null },
    status: {
      type: String,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.PENDING,
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "complaints", timestamps: false }
);

complaintSchema.index({ created_at: -1 });
complaintSchema.index({ author_id: 1, created_at: -1 });
complaintSchema.index({ "location.city": 1, created_at: -1 });

complaintSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export const ComplaintModel =
  (mongoose.models?.Complaint as mongoose.Model<ComplaintDocument>) ??
  mongoose.model<ComplaintDocument>("Complaint", complaintSchema);
