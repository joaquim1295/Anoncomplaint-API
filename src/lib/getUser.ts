import { cookies } from "next/headers";
import { verifyJWT } from "./authService";
import * as userRepository from "./repositories/userRepository";

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "anon_session";

export async function getUser(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifyJWT(token);
  if (!session?.userId) return null;
  const user = await userRepository.findUserById(session.userId);
  if (!user) return null;
  if (user.banned_at) return null;
  return { userId: String(user._id) };
}

export async function getCurrentUser(): Promise<{
  userId: string;
  email: string;
  username?: string;
  role: string;
  subscribedComplaints?: string[];
} | null> {
  const session = await getUser();
  if (!session) return null;
  const user = await userRepository.findUserById(session.userId);
  if (!user) return null;
  if (user.banned_at) return null;
  return {
    userId: String(user._id),
    email: user.email,
    username: user.username,
    role: user.role ?? "user",
    subscribedComplaints: user.subscribedComplaints ?? [],
  };
}
