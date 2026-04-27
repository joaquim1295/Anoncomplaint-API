import { cookies } from "next/headers";
import { jsonData } from "../../../../../lib/api/http";

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? "anon_session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return jsonData({ success: true });
}

