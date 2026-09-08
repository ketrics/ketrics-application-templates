# Ketrics Application — Hello World Template

A reference application for the Ketrics platform. Every domain file demonstrates one SDK
subsystem, using the same layout, guards and configuration rules a production app should keep.

## Structure

```
├── ketrics.config.json    # Application configuration
├── CLAUDE.md              # Development instructions
├── backend/               # TypeScript handlers for the Runtime API
│   └── src/
│       ├── index.ts       # Re-exports only — the manifest of callable handlers
│       ├── types.ts       # Shared interfaces, no runtime code
│       ├── permissions.ts # PERMISSIONS + typed requirePermission + getPermissions
│       ├── helpers.ts     # Resource accessors + attachmentDisposition
│       ├── logger.ts      # DEBUG_LEVEL-gated logger
│       ├── general.ts     # echo, info
│       ├── documents.ts   # DocumentDB examples (pk/sk CRUD, cursor pagination)
│       ├── volumes.ts     # Volume storage examples
│       ├── database.ts    # SQL data connection examples
│       ├── parameters.ts  # Shared JSON configuration examples
│       ├── secrets.ts     # Encrypted secret examples
│       ├── pdf.ts         # PDF generation examples
│       ├── excel.ts       # Excel workbook examples
│       ├── messages.ts    # User messaging examples
│       ├── jobs.ts        # Background job examples
│       └── http.ts        # HTTP client examples
├── frontend/              # React + TypeScript + Vite frontend
│   └── src/
│       ├── App.tsx        # Permission-aware UI with feature demos
│       ├── types.ts       # Shared response shapes
│       ├── services/      # API client (payload-wrapped requests)
│       └── mocks/         # Dev-mode mock handlers
└── tests/                 # Test request definitions
```

## Backend file organization

`index.ts` is a **manifest**: it imports handlers from domain files and re-exports them, and every
name in the config's `functions` array appears there — including `_processInBackground`, which the
platform invokes. It holds no logic.

Group code by **domain / feature**, not by layer. esbuild bundles the whole `src/` tree into a
single `dist/index.js`, so multi-file source costs nothing at runtime and pays back in readability
and diff clarity. Co-locate helpers with the handlers that use them; only promote one to
`helpers.ts` once three or more domain files need it. Split a domain file when it passes roughly
700 lines, or when a heavyweight side concern starts to dominate it.

## Backend Functions

| Function | Capability | Description |
| --- | --- | --- |
| `getPermissions` | — | Reports what the current user can do, for permission-aware UI |
| `echo` | `read` | Returns payload with full context info |
| `info` | `read` | Returns runtime environment details |
| `createDocument` | `write` | Store a document in DocumentDB |
| `getDocument` | `read` | Read one document by id |
| `listDocuments` | `read` | List documents with cursor pagination |
| `updateDocument` | `write` | Update a document, with an ownership check |
| `deleteDocument` | `write` | Delete a document, with an ownership check |
| `saveFile` | `write` | Write JSON and text files to a volume |
| `readFile` | `read` | Read and parse files from a volume |
| `listFiles` | `read` | List files in a volume with prefix filtering |
| `generateDownloadUrl` | `read` | Generate a temporary download URL |
| `copyFile` | `write` | Copy a file within a volume |
| `queryUsers` | `read` | Query records over a SQL data connection |
| `insertRecord` | `write` | Insert a record over a SQL data connection |
| `transferFunds` | `approve` | Database transaction example |
| `createSimplePdf` | `export` | Generate a simple PDF document |
| `createInvoicePdf` | `export` | Generate an invoice-style PDF |
| `createSpreadsheet` | `export` | Create an Excel workbook |
| `exportDataToExcel` | `export` | Export data to a multi-sheet Excel file |
| `getSecret` | `read` | Retrieve an encrypted secret |
| `getAppSettings` | `read` | Read shared JSON configuration from a Parameter |
| `getOptionalAppSettings` | `read` | Read the same Parameter as optional config, with defaults |
| `sendNotification` | `write` | Send a notification to the current user |
| `sendBulkNotification` | `write` | Send notifications to multiple users |
| `listUsers` | `read` | List tenant users (recipients for bulk notifications) |
| `scheduleBackgroundJob` | `write` | Schedule a background job |
| `getJobStatus` | `read` | Check background job status |
| `_processInBackground` | — | Background handler, invoked by the platform |
| `fetchExternalApi` | `read` | Make an external HTTP request |

## Ketrics SDK

Backend handlers access the `ketrics` global object injected at runtime — no imports needed.
Types come from `@ketrics/sdk-backend` (a devDependency; `ketrics.Parameter` needs >= 0.17.0).

```typescript
// Context
ketrics.tenant          // { id, code, name }
ketrics.application     // { id, code, name, version, deploymentId }
ketrics.requestor       // { type, userId, email, name, applicationPermissions }
ketrics.runtime         // { nodeVersion, runtime, region }
ketrics.environment     // key-value environment variables

// Utilities
ketrics.console         // { log, error, warn, info, debug } → CloudWatch
ketrics.http            // { get, post, put, delete } → external APIs

// Feature Modules
ketrics.DocumentDb      // .connect(code) → NoSQL document storage (pk/sk)
ketrics.Volume          // .connect(code) → S3-backed file storage
ketrics.Database        // .connect(code) → SQL data connections (PostgreSQL, MySQL, ...)
ketrics.Secret          // .get(code) → encrypted secrets
ketrics.Parameter       // .get(code) / .exists(code) → shared, unencrypted JSON config
ketrics.Excel           // .create() / .read(buffer) → Excel workbooks
ketrics.Pdf             // .create() / .read(buffer) → PDF documents
ketrics.Job             // .runInBackground(params) → async job execution
ketrics.Messages        // .send(params) / .sendBulk(params) → user notifications
ketrics.Users           // .list() → tenant users
ketrics.Applications    // .connect(code) → cross-application invocation
```

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

## Application Configuration

`ketrics.config.json` declares the app to the platform. The deployment lambda reads it and syncs
the Application record:

| Field | Purpose |
| --- | --- |
| `actions` | Capabilities (`read`, `write`, `export`, `approve`) — the vocabulary roles grant and handlers check. **Not** handler names, **not** role names. Each entry is a string or `{ code, description }` |
| `functions` | Backend handler names re-exported from `backend/src/index.ts`, including background handlers prefixed with `_` |
| `environment` | Plain values the app reads via `ketrics.environment["NAME"]` — thresholds, URLs, flags. Created empty on deploy; mandatory while declared (undeletable and unrenameable in the portal, values editable) |
| `resources` | Ketrics-managed resources, under five kinds: `documentdb`, `volume`, `secret`, `parameter`, `connection`. Each binds to an environment variable — explicit via `environmentVariable` (which must then also be declared in `environment`), or derived from the kind and code (`app-data` documentdb → `APP_DATA_DOCDB`) |
| `roles` | Application roles to create; every action a role lists must appear in `actions`. Without `roles`, no per-user application roles are created at all |

> `environmentVariables` was renamed to `environment`. The old key now fails deployment instead
> of being ignored.

When adding a handler: write it in the relevant domain file guarded with `requirePermission(...)`,
re-export it from `backend/src/index.ts`, and add its name to `functions`. Add to `actions` only
when the handler needs a genuinely new capability — and then add the same code to `PERMISSIONS` in
`backend/src/permissions.ts`, which is hand-synced with the config.

### Permissions

`backend/src/permissions.ts` declares the capabilities this app enforces and the typed guard
handlers call. Because `requirePermission` takes a `Permission` and not a `string`, a typo is a
compile error rather than a handler no role can reach.

| Capability | Guards |
| --- | --- |
| `read` | `echo`, `info`, `getDocument`, `listDocuments`, `readFile`, `listFiles`, `generateDownloadUrl`, `queryUsers`, `getSecret`, `getAppSettings`, `getOptionalAppSettings`, `listUsers`, `getJobStatus`, `fetchExternalApi` |
| `write` | `createDocument`, `updateDocument`, `deleteDocument`, `saveFile`, `copyFile`, `insertRecord`, `sendNotification`, `sendBulkNotification`, `scheduleBackgroundJob` |
| `export` | `createSimplePdf`, `createInvoicePdf`, `createSpreadsheet`, `exportDataToExcel` |
| `approve` | `transferFunds` |

`transferFunds` is guarded by `approve` rather than `write` on purpose: moving funds is a
capability you may want to grant separately from ordinary edits. The `approver` role in
`ketrics.config.json` grants `read` and `approve` without `write` — a separation of duties that
role-shaped actions cannot express.

`getPermissions` reports the union of the user's capabilities as `can*` booleans so the UI can hide
actions they cannot perform. That is a convenience only: every handler still guards itself. Never
test a **role code** against `ketrics.requestor.applicationPermissions` — it holds capabilities, so
`includes("editor")` can never match.

### Required environment variables

Resource codes are never hardcoded in this template. `backend/src/helpers.ts` reads them from
`ketrics.environment` and throws a message naming the variable when one is unset, so configure
these in the portal before running the handlers. Resource-bound variables get a **picker** in the
application's Update form, so an admin selects an existing resource instead of typing a code.

| Variable | Bound to | Used by |
| --- | --- | --- |
| `APP_DATA_DOCDB` | `resources.documentdb` code `app-data` (derived name) | the five `*Document` handlers |
| `DEMO_VOLUME` | `resources.volume` code `test-volume` (explicit `environmentVariable`) | `saveFile`, `readFile`, `listFiles`, `generateDownloadUrl`, `copyFile`, both PDF handlers, both Excel handlers |
| `APIKEY_SECRET` | `resources.secret` code `apikey` (derived name) | `getSecret` (unless the payload passes an explicit `code`) |
| `APP_SETTINGS_PARAMETER` | `resources.parameter` code `app-settings` (derived name) | `getAppSettings`, `getOptionalAppSettings` |
| `MAIN_DB_CONNECTION` | `resources.connection` code `main-db` (derived name) | `queryUsers`, `insertRecord`, `transferFunds` |
| `DEBUG_LEVEL` | plain `environment` entry | `backend/src/logger.ts` |

All of them are created on deploy and cannot be deleted or renamed while declared; their values
stay editable.

**Secrets vs. parameters:** a Parameter is shared, tenant-level JSON that several applications can
read — right for a chart of accounts or tax tables. Its values are stored in **plaintext**.
Credentials, API keys and tokens belong in a Secret, never in a Parameter.

**SQL data connections changed sides.** They used to be declared as a plain `environment` entry;
since `connection` became a declarable resource kind they belong under `resources`, which is what
gives the portal a picker and auto-grants `connection:{code}`. This needs CLI >= 0.14.0.

## Logging

`backend/src/logger.ts` gates output on the `DEBUG_LEVEL` environment variable
(`none | error | warn | info | debug`, each level including the ones above it; unset means
`error`). An administrator raises the level in the portal to trace a misbehaving flow in
CloudWatch and lowers it again — no redeploy, and the `[scope]` prefix keeps CloudWatch filtering
clean. Log counts, IDs, keys and statuses; never secrets, tokens or PII.

## Downloads and the iframe CSP

Every `generateDownloadUrl` call in this template passes
`responseContentDisposition: attachmentDisposition(filename)`. The app frontend runs in an iframe
under a strict `frame-src https://cdn.ketrics.io` CSP, and presigned Volume URLs point at the S3
bucket host. Without a forced attachment the browser tries to render the file by navigating the
iframe to S3, the CSP blocks the navigation, and the download fails silently. This applies to every
Volume URL the frontend follows, not just export buttons.

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
app with its previous actions, roles and variables. The included workflow pins `@^0.14` (the
`parameter` and `connection` resource kinds need 0.14.0), uses `node-version: 24`, and the repo
root carries `.npmrc` with `engine-strict=true`. After the first deploy, confirm the app's actions,
roles and variables actually changed.

## API Request Format

All function calls use the Runtime API with payload wrapped in a `payload` property:

```json
POST /tenants/{tenantId}/applications/{applicationId}/functions/{functionName}
{
  "payload": { "your": "data" }
}
```
