export type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type User = {
  id: string;
  userId?: string;
  email: string;
  username?: string | null;
  role?: string | null;
  canCompanyMode?: boolean;
  accountMode?: "personal" | "company";
};

export type Complaint = {
  id: string;
  title?: string | null;
  content: string;
  tags?: string[];
  status?: string;
  created_at?: string;
  author_label?: string;
  companyName?: string | null;
  companySlug?: string | null;
  topic_slug?: string | null;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  complaintId?: string | null;
};

export type TopicItem = {
  slug: string;
  title: string;
  description?: string | null;
  complaint_count?: number;
};

export type CompanyPublic = {
  id: string;
  name: string;
  slug: string;
  logo_image?: string | null;
  website?: string | null;
  description?: string | null;
  views_count?: number;
};
