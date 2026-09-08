/**
 * Mock Backend Handlers
 *
 * Define mock responses for your backend functions here.
 * These are used automatically when running `npm run dev` (local development)
 * and are completely excluded from production builds.
 *
 * Each key corresponds to a backend function name exported from
 * backend/src/index.ts. Handler names MUST match the backend exports exactly.
 */

type MockHandler = (payload?: unknown) => unknown | Promise<unknown>;

const handlers: Record<string, MockHandler> = {
  // Flip these to false to preview the UI as a user without the capability.
  getPermissions: () => ({
    canRead: true,
    canWrite: true,
    userId: "mock-user-id",
    userName: "Local Developer",
  }),

  echo: (payload) => ({
    payload,
    context: {
      tenant: { id: "mock-tenant-id", code: "mock-tenant", name: "Mock Tenant" },
      application: { id: "mock-app-id", code: "mock-app", name: "Mock App", version: "1.0.0", deploymentId: "mock-deploy" },
      requestor: { type: "user", userId: "mock-user-id", email: "dev@localhost", name: "Local Developer", applicationPermissions: ["read", "write"] },
      runtime: { nodeVersion: "18.x", runtime: "mock", region: "local" },
      environment: {},
    },
  }),

  greet: (payload) => {
    const { name } = (payload as { name?: string }) || {};
    return {
      message: `Hello, ${name?.trim() || "Local Developer"}! Welcome to Mock App.`,
      greetedAt: new Date().toISOString(),
    };
  },

  notifyMe: (payload) => {
    const { subject } = (payload as { subject?: string }) || {};
    return {
      messageId: `mock-message-${Date.now()}`,
      status: "SENT",
      subject: subject || "Hello from your app!",
    };
  },
};

export { handlers };
export type { MockHandler };
