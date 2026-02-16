import { createAuthManager } from "@ketrics/sdk-frontend";

interface APIClientInterface {
  run(fnName: string, payload?: unknown): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Real API Client — used when deployed (production builds)
// ---------------------------------------------------------------------------
class APIClient implements APIClientInterface {
  private auth;

  constructor(authManager: ReturnType<typeof createAuthManager>) {
    this.auth = authManager;
  }

  private async makeRequest(fnName: string, payload?: unknown) {
    const runtimeApiUrl = this.auth.getRuntimeApiUrl();
    const tenantId = this.auth.getTenantId();
    const applicationId = this.auth.getApplicationId();
    const accessToken = this.auth.getAccessToken();

    if (!runtimeApiUrl || !tenantId || !accessToken) {
      throw new Error("Missing authentication context");
    }

    const response = await fetch(`${runtimeApiUrl}/tenants/${tenantId}/applications/${applicationId}/functions/${fnName}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: payload ?? null }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message = errorBody?.error?.message || `API request failed with status ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  }

  async run(fnName: string, payload?: unknown) {
    return this.makeRequest(fnName, payload);
  }
}

// ---------------------------------------------------------------------------
// Client initialization — mock in dev, real in production
// ---------------------------------------------------------------------------
async function createClient(): Promise<APIClientInterface> {
  if (import.meta.env.DEV) {
    const { createMockClient } = await import("../mocks/mock-client");
    return createMockClient();
  }

  const auth = createAuthManager();
  auth.initAutoRefresh({
    refreshBuffer: 60,
    onTokenUpdated: () => {},
  });
  return new APIClient(auth);
}

const apiClient = await createClient();

export { apiClient };
