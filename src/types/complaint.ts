export enum ComplaintStatus {
  PENDING = "pending",
  PENDING_REVIEW = "pending_review",
  REVIEWED = "reviewed",
  RESOLVED = "resolved",
  ARCHIVED = "archived",
}

export interface ComplaintLocationDisplay {
  lat: number;
  lng: number;
  city: string;
}

export interface OfficialResponseDisplay {
  id: string;
  companyId: string;
  companyOwnerUserId: string;
  companyName: string;
  companySlug?: string | null;
  content: string;
  createdAt: Date;
  createdAt_label?: string;
  replies?: OfficialResponseReplyDisplay[];
}

export interface OfficialResponseReplyDisplay {
  id: string;
  authorUserId: string;
  authorLabel: string;
  content: string;
  parentReplyId?: string | null;
  createdAt: Date;
  createdAt_label?: string;
}

export interface ComplaintDisplay {
  id: string;
  author_id?: string | null;
  title?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  companySlug?: string | null;
  content: string;
  attachments?: string[];
  ai_summary?: string | null;
  tags: string[];
  /** Slug do tópico tipo Reddit (/t/[slug]); denúncia continua no feed global. */
  topic_slug?: string | null;
  topic_title?: string | null;
  status: ComplaintStatus;
  ghost_mode: boolean;
  created_at: Date;
  updated_at: Date;
  /** Definido quando o autor alterou título ou texto após a publicação. */
  edited_at?: Date | null;
  created_at_label: string;
  author_label: "Anónimo" | string;
  endorsedBy: string[];
  officialResponses?: OfficialResponseDisplay[];
  final_rating?: number | null;
  location?: ComplaintLocationDisplay | null;
}
