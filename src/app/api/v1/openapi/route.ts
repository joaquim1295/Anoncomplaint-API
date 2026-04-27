import { getOpenApiSpec } from "../../../../lib/api/openapi";

export async function GET() {
  return Response.json(getOpenApiSpec(), { status: 200 });
}

