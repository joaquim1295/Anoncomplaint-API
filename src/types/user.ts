export enum UserRole {
  USER = "user",
  COMPANY = "company",
  ADMIN = "admin",
}

export interface User {
  id: string;
  email: string;
  created_at: Date;
  role?: UserRole;
  subscribedComplaints?: string[];
}
