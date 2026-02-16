# Frontend Reference

Patterns for the React frontend of a Ketrics tenant application. The frontend is built with Vite + React 18 + TypeScript and embedded as an iframe in the Ketrics platform.

## Service layer

The service layer provides a single `callFunction<T>(fnName, payload)` interface between frontend and backend. In dev mode, calls route to mock handlers. In production, calls go to the Ketrics Runtime API with JWT auth.

### `frontend/src/services/index.ts`

```typescript
import { createAuthManager } from "@ketrics/sdk-frontend";

const auth = createAuthManager();
auth.initAutoRefresh({ refreshBuffer: 60, onTokenUpdated: () => {} });

export async function callFunction<T = unknown>(
  fnName: string,
  payload?: unknown
): Promise<{ result: T }> {
  if (import.meta.env.DEV) {
    const { handlers } = await import("../mocks/handlers");
    const handler = handlers[fnName];
    if (!handler) {
      throw new Error(`[Mock] No handler for "${fnName}"`);
    }
    await new Promise((r) => setTimeout(r, 200)); // Simulate network delay
    const result = await handler(payload);
    console.log(`[Mock] ${fnName}`, { payload, result });
    return { result: result as T };
  }

  const runtimeApiUrl = auth.getRuntimeApiUrl();
  const tenantId = auth.getTenantId();
  const applicationId = auth.getApplicationId();
  const accessToken = auth.getAccessToken();

  if (!runtimeApiUrl || !tenantId || !applicationId || !accessToken) {
    throw new Error("Missing authentication context");
  }

  const response = await fetch(
    `${runtimeApiUrl}/tenants/${tenantId}/applications/${applicationId}/functions/${fnName}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: payload !== undefined ? JSON.stringify({ payload }) : undefined,
    }
  );

  if (!response.ok) {
    if (response.status === 401) auth.requestRefresh();
    const errorBody = await response.text();
    throw new Error(`Error API (${response.status}): ${errorBody}`);
  }

  return response.json() as Promise<{ result: T }>;
}

export { auth };
```

### Key points

- `import.meta.env.DEV` — Vite's built-in env flag for dev mode detection
- `createAuthManager()` — Returns an auth manager that handles JWT tokens in the iframe context
- `auth.initAutoRefresh()` — Keeps the token fresh; `refreshBuffer: 60` means refresh 60s before expiry
- `auth.requestRefresh()` — Called on 401 to force a token refresh
- Handler names must match exactly between `callFunction("handlerName", ...)` and `backend/src/index.ts` exports

## Calling backend handlers

```typescript
import { callFunction } from "../services";

// Simple call (no payload)
const { result } = await callFunction<{ connections: Connection[] }>("getConnections");

// Call with payload
const { result } = await callFunction<{ item: Item }>("createItem", {
  name: "My Item",
  description: "Item description",
});

// Call with typed response
interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
}
const { result } = await callFunction<QueryResult>("executeQuery", {
  connectionCode: "main-db",
  sql: "SELECT * FROM users",
  params: [],
});
```

## Mock handlers

Create mock handlers for local development. These let you run the frontend without a backend.

### `frontend/src/mocks/handlers.ts`

```typescript
type MockHandler = (payload?: unknown) => unknown | Promise<unknown>;

// In-memory stores
let itemsStore: Item[] = [
  { id: "1", name: "Sample Item", createdBy: "mock-user", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
];

const handlers: Record<string, MockHandler> = {
  listItems: () => ({
    items: itemsStore,
  }),

  getItem: (payload: unknown) => {
    const { id } = payload as { id: string };
    const item = itemsStore.find(i => i.id === id);
    if (!item) throw new Error("Not found");
    return { item };
  },

  createItem: (payload: unknown) => {
    const { name, description } = payload as { name: string; description?: string };
    const now = new Date().toISOString();
    const newItem: Item = {
      id: crypto.randomUUID(),
      name,
      description: description || "",
      createdBy: "mock-user",
      createdAt: now,
      updatedAt: now,
    };
    itemsStore.push(newItem);
    return { item: newItem };
  },

  updateItem: (payload: unknown) => {
    const { id, name, description } = payload as { id: string; name: string; description?: string };
    const idx = itemsStore.findIndex(i => i.id === id);
    if (idx === -1) throw new Error("Not found");
    itemsStore[idx] = { ...itemsStore[idx], name, description: description || "", updatedAt: new Date().toISOString() };
    return { item: itemsStore[idx] };
  },

  deleteItem: (payload: unknown) => {
    const { id } = payload as { id: string };
    itemsStore = itemsStore.filter(i => i.id !== id);
    return { success: true };
  },

  getPermissions: () => ({
    isEditor: true,
    userId: "mock-user",
    userName: "Mock User",
  }),
};

export { handlers };
```

### Mock handler rules

- Handler names MUST match the backend exports exactly
- Use in-memory arrays/objects for state (persists only during the dev session)
- Cast `payload` to the expected type (mock handlers receive `unknown`)
- Simulate realistic response shapes matching what the backend returns

## TypeScript types

Define shared interfaces in `frontend/src/types.ts`. These mirror the backend types and define the shape of API responses.

```typescript
// Common pattern: one full interface + one summary for list views
export interface Item {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemSummary {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
```

## Vite configuration

### `frontend/vite.config.ts`

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",  // Important for iframe embedding
});
```

### `frontend/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Ketrics App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### `frontend/src/main.tsx`

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Frontend package.json

```json
{
  "name": "my-ketrics-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ketrics/sdk-frontend": "^0.1.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.0"
  }
}
```

## Common frontend patterns

### Loading and error states

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const { result } = await callFunction<{ items: Item[] }>("listItems");
    setItems(result.items);
  } catch (err) {
    setError(err instanceof Error ? err.message : "An error occurred");
  } finally {
    setLoading(false);
  }
};
```

### File download from presigned URL

```typescript
const handleExport = async () => {
  try {
    const { result } = await callFunction<{ url: string; filename: string }>(
      "exportData",
      { /* payload */ }
    );
    // Trigger browser download
    const a = document.createElement("a");
    a.href = result.url;
    a.download = result.filename;
    a.click();
  } catch (err) {
    setError(err instanceof Error ? err.message : "Export failed");
  }
};
```

### Permission-based UI

```typescript
const [isEditor, setIsEditor] = useState(false);

useEffect(() => {
  callFunction<{ isEditor: boolean }>("getPermissions")
    .then(({ result }) => setIsEditor(result.isEditor))
    .catch(() => setIsEditor(false));
}, []);

// In JSX
{isEditor && <button onClick={handleDelete}>Delete</button>}
```
