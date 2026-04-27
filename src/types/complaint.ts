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
  companyId: string;
  content: string;
  createdAt: Date;
  createdAt_label?: string;
}

export interface ComplaintDisplay {
  id: string;
  content: string;
  tags: string[];
  status: ComplaintStatus;
  created_at: Date;
  updated_at: Date;
  created_at_label: string;
  author_label: "Anónimo" | string;
  endorsedBy: string[];
  officialResponse?: OfficialResponseDisplay | null;
  location?: ComplaintLocationDisplay | null;
}
