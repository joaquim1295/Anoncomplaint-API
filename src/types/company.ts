export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_image?: string | null;
  taxId?: string | null;
  website?: string | null;
  description?: string | null;
  views_count: number;
  ownerUserId?: string;
  ownerEmail?: string;
  created_at: Date;
}

