# Ketrics Application — Blank Template

A minimal starter template for building applications on the Ketrics platform.

## Structure

```
├── ketrics.config.json    # Application configuration
├── backend/               # TypeScript handlers for Runtime API
│   └── src/
│       ├── permissions.ts # PERMISSIONS + typed requirePermission guard
│       └── index.ts       # Main exports (echo handler)
├── frontend/              # React + TypeScript + Vite frontend
│   └── src/
│       ├── App.tsx        # Main UI
│       └── services/      # API client
└── tests/                 # Test request definitions
```

## Backend Functions

| Function | Description |
| --- | --- |
| `echo` | Returns the payload with context info |

## Setup

### Backend

```bash
cd backend
npm install
npm run build
```

### Frontend

```bash
cd frontend
npm install
npm run dev    # Local development with mock handlers
npm run build  # Production build
```

## Deploy

```bash
ketrics deploy
```

## Adding New Handlers

1. Create a new async function in `backend/src/index.ts`
2. Guard it on the first line with `requirePermission(...)` from `backend/src/permissions.ts`
3. Export it from `backend/src/index.ts`
4. Add the function name to the `functions` array in `ketrics.config.json` — **not** to
   `actions`, which lists the capabilities (`read`, `write`) roles grant
5. Add a mock handler in `frontend/src/mocks/handlers.ts`
6. Call it from the frontend using `apiClient.run("functionName", payload)`

## Permissions

`backend/src/permissions.ts` declares the capabilities this app enforces:

```typescript
export const PERMISSIONS = ["read", "write"] as const;
```

Handlers call `requirePermission("read")`. The parameter is typed, so `requirePermission("raed")`
is a compile error instead of a handler no role can ever reach. Adding a capability means editing
**both** `PERMISSIONS` and the `actions` array in `ketrics.config.json` — nothing verifies that
the two agree.

## Application Configuration

`ketrics.config.json` declares the app to the platform:

| Field | Purpose |
| --- | --- |
| `actions` | Capabilities (`read`, `write`) — the vocabulary roles grant and handlers check. Not handler names. Each entry is a string or `{ code, description }`, and the codes must match `PERMISSIONS` |
| `functions` | Backend handler names exported from `backend/src/index.ts` |
| `environment` | Environment variables the app reads via `ketrics.environment["NAME"]`. Created empty on deploy; mandatory while declared (undeletable in the portal, values editable) |
| `resources` | DocumentDB / Volume / Secret resources. Each binds to an environment variable — explicit via `environmentVariable`, or derived (`files` volume → `FILES_VOLUME`) |
| `roles` | Application roles to create; every action a role lists must appear in `actions` |

> `environmentVariables` was renamed to `environment`. The old key now fails deployment.

## SDK Reference

The `ketrics` global object is available in all backend handlers:

```typescript
ketrics.tenant          // { id, code, name }
ketrics.application     // { id, code, name, version, deploymentId }
ketrics.requestor       // { type, userId, email, name, applicationPermissions }
ketrics.runtime         // { nodeVersion, runtime, region }
ketrics.environment     // key-value environment variables
ketrics.console         // { log, error, warn, info, debug }
ketrics.http            // { get, post, put, delete }
ketrics.Volume          // .connect(code) — S3-backed file storage
ketrics.Database        // .connect(code) — SQL databases
ketrics.Secret          // .get(code) — encrypted secrets
ketrics.Excel           // .create() — Excel workbooks
ketrics.Pdf             // .create() — PDF documents
ketrics.Job             // .runInBackground(params) — async jobs
ketrics.Messages        // .send(params) — user notifications
```
