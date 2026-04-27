import * as complaintService from "../../../../lib/complaintService";
import { jsonData } from "../../../../lib/api/http";

export async function GET() {
  const stats = await complaintService.getStats();
  return jsonData(stats);
}

