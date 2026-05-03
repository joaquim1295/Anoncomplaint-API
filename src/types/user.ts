export enum UserRole {
  USER = "user",
  COMPANY = "company",
  ADMIN = "admin",
}

export interface User {
  id: string;
  email: string;
  username?: string;
  profile_image?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  public_profile_enabled?: boolean;
  created_at: Date;
  role?: UserRole;
  subscribedComplaints?: string[];
}
