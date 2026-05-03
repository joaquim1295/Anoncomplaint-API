export interface TopicDisplay {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  company_id: string | null;
  complaint_count: number;
  created_at: Date;
}
