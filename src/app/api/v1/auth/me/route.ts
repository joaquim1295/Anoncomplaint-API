import { cookies } from "next/headers";
import { getApiSession } from "../../../../../lib/api/auth";
import * as userRepository from "../../../../../lib/repositories/userRepository";
import * as companyService from "../../../../../lib/companyService";
import { ACCOUNT_MODE_COOKIE } from "../../../../../lib/accountMode";
import { jsonData, jsonError } from "../../../../../lib/api/http";

export async function GET(request: Request) {
  const session = await getApiSession(request);
  if (!session) return jsonError("unauthorized", "Authentication required", 401);
  const user = await userRepository.findUserById(session.userId);
  if (!user) return jsonError("unauthorized", "Authentication required", 401);

  const companies = await companyService.listForUser(session.userId);
  const canCompanyMode = companies.length > 0;
  const cookieStore = await cookies();
  const raw = cookieStore.get(ACCOUNT_MODE_COOKIE)?.value;
  let accountMode: "personal" | "company" = raw === "company" ? "company" : "personal";
  if (!canCompanyMode) accountMode = "personal";

  return jsonData({
    id: String(user._id),
    userId: String(user._id),
    email: user.email,
    username: user.username ?? null,
    role: user.role ?? "user",
    profile_image: user.profile_image ?? null,
    bio: user.bio ?? null,
    location: user.location ?? null,
    website: user.website ?? null,
    public_profile_enabled: Boolean(user.public_profile_enabled),
    email_verified: user.email_verified !== false,
    subscribedComplaints: user.subscribedComplaints ?? [],
    followedTopics: user.followedTopics ?? [],
    accountMode,
    canCompanyMode,
  });
}

