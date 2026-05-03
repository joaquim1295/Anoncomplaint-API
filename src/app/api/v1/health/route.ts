import { jsonData } from "../../../../lib/api/http";
import { getConnection } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let mongo_ok = false;
  try {
    const m = await getConnection();
    const db = m.connection?.db;
    if (db?.admin) {
      const ping = await db.admin().ping();
      mongo_ok = (ping as { ok?: number }).ok === 1;
    }
  } catch {
    mongo_ok = false;
  }

  const status = mongo_ok ? "ok" : "degraded";

  return jsonData({
    status,
    service: "smart-complaint-api",
    version: "v1",
    now: new Date().toISOString(),
    checks: { mongodb: mongo_ok },
    pusher_configured: Boolean(
      process.env.PUSHER_APP_ID && process.env.PUSHER_SECRET && process.env.PUSHER_APP_KEY
    ),
  });
}
