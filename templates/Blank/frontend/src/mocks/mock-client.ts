/**
 * Mock API Client
 *
 * Replaces the real API client during local development (`npm run dev`).
 * Routes function calls to the mock handlers defined in ./handlers.ts
 * instead of making HTTP requests to the Ketrics Runtime API.
 *
 * This file is tree-shaken out of production builds by Vite.
 */

import { handlers } from "./handlers";

class MockAPIClient {
  async run(fnName: string, payload?: unknown) {
    const handler = handlers[fnName];

    if (!handler) {
      throw new Error(
        `[Mock] No handler defined for "${fnName}". ` +
        `Add it to src/mocks/handlers.ts to use it in local development.`
      );
    }

    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const result = await handler(payload);
      console.log(`[Mock] ${fnName}`, { payload, result });
      return { success: true, result };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Mock] ${fnName} error:`, message);
      throw new Error(message);
    }
  }
}

export function createMockClient() {
  console.log(
    "%c[Ketrics] Running with mock backend — edit src/mocks/handlers.ts to customize responses",
    "color: #f59e0b; font-weight: bold;"
  );
  return new MockAPIClient();
}
