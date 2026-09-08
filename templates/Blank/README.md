# Ketrics Application — Blank Template

A minimal starter template for building applications on the Ketrics platform. It is deliberately
small, but it already uses the layout and guards a real app should keep as it grows.

## Structure

```
├── ketrics.config.json      # Application configuration
├── CLAUDE.md                # Development instructions
├── backend/                 # TypeScript handlers for the Runtime API
│   └── src/
│       ├── index.ts         # Re-exports only — the manifest of callable handlers
│       ├── types.ts         # Shared interfaces, no runtime code
│       ├── permissions.ts   # PERMISSIONS + typed requirePermission + getPermissions
│       ├── helpers.ts       # Cross-cutting utilities (env accessors)
│       ├── logger.ts        # DEBUG_LEVEL-gated logger
│       ├── greeting.ts      # Domain file — echo, greet
│       └── notifications.ts # Domain file — notifyMe
├── frontend/                # React + TypeScript + Vite frontend
│   └── src/
│       ├── App.tsx          # Permission-aware UI
│       ├── types.ts         # Shared response shapes
│       ├── services/        # API client (mock in dev, Runtime API in prod)
│       └── mocks/           # Dev-mode mock handlers
└── tests/                   # Test request definitions
```

## Backend Functions

| Function | Capability | Description |
| --- | --- | --- |
| `getPermissions` | — | Reports what the current user can do, for permission-aware UI |
| `echo` | `read` | Returns the payload with full context info |
| `greet` | `read` | Greeting built from the `WELCOME_MESSAGE` environment variable |
| `notifyMe` | `write` | Sends a notification to the caller's Ketrics inbox |

## Backend file organization

`index.ts` is a **manifest**: it imports handlers from domain files and re-exports them, and every
name in the config's `functions` array appears there. It holds no logic.

Group code by **domain / feature**, not by layer — one file per coherent area (`greeting.ts`,
`notifications.ts`, and whatever your app is actually about). esbuild bundles the whole `src/`
tree into a single `dist/index.js`, so multi-file source costs nothing at runtime and pays back in
readability and diff clarity. Co-locate helpers with the handlers that use them; only promote one
to `helpers.ts` once three or more domain files need it.

Split a domain file when it passes roughly 700 lines, or when a heavyweight side concern (SQL
posting, multi-step report generation) starts to dominate it.

## Setup

### Backend

```bash
cd backend
npm install
npm run build       # esbuild -> dist/index.js
npm run typecheck   # tsc --noEmit — catches typo'd permissions
```

### Frontend

```bash
cd frontend
npm install
npm run dev    # Local development with mock handlers — no backend needed
npm run build  # Production build
```

## Deploy

Install the CLI **with an explicit tag**, on Node 24 or newer:

```bash
node --version
npm install -g @ketrics/ketrics-cli@latest
ketrics --version   # if this prints 0.1.0, upgrade Node and reinstall
ketrics deploy --env .env
```

Plain `npm install -g @ketrics/ketrics-cli` on older Node does not fail — npm walks back to
`0.1.0`, which ships a ZIP with no `ketrics.config.json` and still **reports success**, leaving the
app with its previous actions, roles and variables. The included workflow pins `@^0.14`, uses
`node-version: 24`, and the repo root carries `.npmrc` with `engine-strict=true`. After the first
deploy, confirm the app's actions, roles and variables actually changed.

## Adding New Handlers

1. Write an async function in the relevant `backend/src/<domain>.ts` (or create a new domain file)
2. Guard it on the first line with `requirePermission(...)` from `backend/src/permissions.ts`
3. Re-export it from `backend/src/index.ts`
4. Add the function name to the `functions` array in `ketrics.config.json` — **not** to
   `actions`, which lists the capabilities (`read`, `write`) roles grant
5. Add a mock handler in `frontend/src/mocks/handlers.ts` under the exact same name
6. Call it from the frontend using `apiClient.run("functionName", payload)`

## Permissions

`backend/src/permissions.ts` declares the capabilities this app enforces:

```typescript
export const PERMISSIONS = ["read", "write"] as const;
```

Handlers call `requirePermission("read")`. The parameter is typed, so `requirePermission("raed")`
is a compile error instead of a handler no role can ever reach. Adding a capability means editing
**both** `PERMISSIONS` and the `actions` array in `ketrics.config.json` — nothing at runtime
verifies that the two agree.

`getPermissions` reports the union of the user's capabilities as `can*` booleans so the UI can hide
actions they cannot perform. That is a convenience only: every handler still guards itself.

Never test a **role code** against `ketrics.requestor.applicationPermissions` — it holds
capabilities, so `includes("editor")` can never match.

## Application Configuration

`ketrics.config.json` declares the app to the platform:

| Field | Purpose |
| --- | --- |
| `actions` | Capabilities (`read`, `write`) — the vocabulary roles grant and handlers check. Not handler names, not role names. Each entry is a string or `{ code, description }`, and the codes must match `PERMISSIONS` |
| `functions` | Backend handler names re-exported from `backend/src/index.ts`, including background handlers prefixed with `_` |
| `environment` | Plain values the app reads via `ketrics.environment["NAME"]` — thresholds, URLs, flags. Created empty on deploy; mandatory while declared (undeletable in the portal, values editable) |
| `resources` | Ketrics-managed resources, under five kinds: `documentdb`, `volume`, `secret`, `parameter`, `connection`. Each binds to an environment variable — explicit via `environmentVariable`, or derived (`exports` volume → `EXPORTS_VOLUME`) — and declaring one is what grants the app access to it |
| `roles` | Application roles to create; every action a role lists must appear in `actions`. Without `roles`, no per-user application roles are created at all |

> `environmentVariables` was renamed to `environment`. The old key now fails deployment.

This template declares no resources, because none of its handlers read one — an unused declaration
is a permanent empty row in the tenant's portal. Add one under its kind when a handler needs it,
then read the bound variable through an accessor in `helpers.ts`:

```jsonc
"resources": {
  "documentdb": [{ "code": "app-data", "description": "Main data store" }]
}
```

```typescript
// helpers.ts
export const appDataDocDbCode = () => requireEnv("APP_DATA_DOCDB");
// domain file
const docdb = await ketrics.DocumentDb.connect(appDataDocDbCode());
```

## Logging

`backend/src/logger.ts` gates output on the `DEBUG_LEVEL` environment variable
(`none | error | warn | info | debug`, each level including the ones above it; unset means
`error`). An administrator raises the level in the portal to trace a misbehaving flow in
CloudWatch and lowers it again — no redeploy. Log counts, IDs and statuses; never secrets, tokens
or PII.

## SDK Reference

The `ketrics` global object is available in all backend handlers, with no imports:

```typescript
ketrics.tenant          // { id, code, name }
ketrics.application     // { id, code, name, version, deploymentId }
ketrics.requestor       // { type, userId, email, name, applicationPermissions }
ketrics.runtime         // { nodeVersion, runtime, region }
ketrics.environment     // key-value environment variables
ketrics.console         // { log, error, warn, info, debug }
ketrics.http            // { get, post, put, delete }
ketrics.DocumentDb      // .connect(code) — NoSQL document storage (pk/sk)
ketrics.Volume          // .connect(code) — S3-backed file storage
ketrics.Database        // .connect(code) — SQL data connections
ketrics.Secret          // .get(code) — encrypted secrets
ketrics.Parameter       // .get(code) / .exists(code) — shared, unencrypted JSON config
ketrics.Excel           // .create() — Excel workbooks
ketrics.Pdf             // .create() — PDF documents
ketrics.Job             // .runInBackground(params) — async jobs
ketrics.Messages        // .send(params) / .sendBulk(params) — user notifications
ketrics.Users           // .list() — tenant users
ketrics.Applications    // .connect(code) — cross-application invocation
```
