export type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type User = {
  id: string;
  email: string;
  username?: string | null;
  role?: string | null;
};

export type Complaint = {
  id: string;
  content: string;
  tags?: string[];
  status?: string;
  created_at?: string;
  author_label?: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

