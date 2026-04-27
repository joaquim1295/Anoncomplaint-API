import { jsonData } from "../../../../lib/api/http";

export async function GET() {
  return jsonData({
    status: "ok",
    service: "anon-complaint-api",
    version: "v1",
    now: new Date().toISOString(),
  });
}

