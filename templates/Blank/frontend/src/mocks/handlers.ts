/**
 * Mock Backend Handlers
 *
 * Define mock responses for your backend functions here.
 * These are used automatically when running `npm run dev` (local development)
 * and are completely excluded from production builds.
 *
 * Each key corresponds to a backend function name exported from backend/src/index.ts.
 */

type MockHandler = (payload?: unknown) => unknown | Promise<unknown>;

const handlers: Record<string, MockHandler> = {
  echo: (payload) => ({
    payload,
    context: {
      tenant: { id: "mock-tenant-id", code: "mock-tenant", name: "Mock Tenant" },
      application: { id: "mock-app-id", code: "mock-app", name: "Mock App", version: "1.0.0", deploymentId: "mock-deploy" },
      requestor: { type: "user", userId: "mock-user-id", email: "dev@localhost", name: "Local Developer", applicationPermissions: [] },
      runtime: { nodeVersion: "18.x", runtime: "mock", region: "local" },
      environment: {},
    },
  }),
};

export { handlers };
export type { MockHandler };
