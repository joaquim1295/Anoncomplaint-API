import * as userRepository from "./repositories/userRepository";
import * as complaintRepository from "./repositories/complaintRepository";
import type { UserDocument } from "../models/User";
import type { ComplaintDocument } from "../models/Complaint";

export async function getAllUsers(): Promise<UserDocument[]> {
  return userRepository.findAll();
}

export async function getAllComplaints(): Promise<ComplaintDocument[]> {
  return complaintRepository.findAll();
}

export async function banUser(userId: string): Promise<UserDocument | null> {
  return userRepository.setBannedAt(userId, new Date());
}

export async function forceDeleteComplaint(complaintId: string): Promise<boolean> {
  return complaintRepository.forceDelete(complaintId);
}
