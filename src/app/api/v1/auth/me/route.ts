import { getApiSession } from "../../../../../lib/api/auth";
import * as userRepository from "../../../../../lib/repositories/userRepository";
import { jsonData, jsonError } from "../../../../../lib/api/http";

export async function GET(request: Request) {
  const session = await getApiSession(request);
  if (!session) return jsonError("unauthorized", "Authentication required", 401);
  const user = await userRepository.findUserById(session.userId);
  if (!user) return jsonError("unauthorized", "Authentication required", 401);
  return jsonData({
    id: String(user._id),
    email: user.email,
    username: user.username ?? null,
    role: user.role ?? "user",
    subscribedComplaints: user.subscribedComplaints ?? [],
  });
}

