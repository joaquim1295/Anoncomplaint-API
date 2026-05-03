import { getOpenApiSpec } from "../lib/api/openapi";

describe("OpenAPI spec", () => {
  it("documents inbox read endpoint", () => {
    const spec = getOpenApiSpec() as { paths: Record<string, { patch?: unknown }> };
    expect(spec.paths["/inbox/conversations/{id}/read"]?.patch).toBeDefined();
  });
});
