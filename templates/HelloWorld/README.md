# Ketrics Application Template

A starter template for building applications on the Ketrics platform, demonstrating all SDK features.

## Structure

```
├── ketrics.config.json    # Application configuration
├── backend/               # TypeScript handlers for Runtime API
│   └── src/
│       ├── index.ts       # Main exports (echo, info)
│       ├── permissions.ts # PERMISSIONS + typed requirePermission guard
│       ├── config.ts      # Resource codes read from ketrics.environment
│       ├── volumes.ts     # Volume storage examples
│       ├── database.ts    # Database connection examples
│       ├── pdf.ts         # PDF generation examples
│       ├── excel.ts       # Excel workbook examples
│       ├── secrets.ts     # Secret management examples
│       ├── messages.ts    # User messaging examples
│       ├── jobs.ts        # Background job examples
│       └── http.ts        # HTTP client examples
├── frontend/              # React + TypeScript + Vite frontend
│   └── src/
│       ├── App.tsx        # Main UI with feature demos
│       └── services/      # API client (payload-wrapped requests)
└── tests/                 # Test request definitions
```

## Backend Functions

| Function | Description |
| --- | --- |
| `echo` | Returns payload with full context info |
| `info` | Returns runtime environment details |
| `saveFile` | Write JSON and text files to a volume |
| `readFile` | Read and parse files from a volume |
| `listFiles` | List files in a volume with prefix filtering |
| `generateDownloadUrl` | Generate a temporary download URL |
| `copyFile` | Copy a file within a volume |
| `queryUsers` | Query records from a database |
| `insertRecord` | Insert a record into a database |
| `transferFunds` | Database transaction example |
| `createSimplePdf` | Generate a simple PDF document |
| `createInvoicePdf` | Generate an invoice-style PDF |
| `createSpreadsheet` | Create an Excel workbook |
| `exportDataToExcel` | Export data to a multi-sheet Excel file |
| `getSecret` | Retrieve an encrypted secret |
| `sendNotification` | Send a notification to the current user |
| `sendBulkNotification` | Send notifications to multiple users |
| `scheduleBackgroundJob` | Schedule a background job |
| `getJobStatus` | Check background job status |
| `fetchExternalApi` | Make an external HTTP request |

## Ketrics SDK (v0.8.0)

Backend handlers access the `ketrics` global object injected at runtime:

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
ketrics.Volume          // .connect(code) → S3-backed file storage
ketrics.Database        // .connect(code) → SQL databases (PostgreSQL, MySQL, etc.)
ketrics.Secret          // .get(code) → encrypted secrets
ketrics.Excel           // .create() / .read(buffer) → Excel workbooks
ketrics.Pdf             // .create() / .read(buffer) → PDF documents
ketrics.Job             // .runInBackground(params) → async job execution
ketrics.Messages        // .send(params) → user notifications
```

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
npm run build
```

## Application Configuration

`ketrics.config.json` declares the app to the platform. The deployment lambda reads it and syncs
the Application record:

| Field | Purpose |
| --- | --- |
| `actions` | Capabilities (`read`, `write`, `export`, `approve`) — the vocabulary roles grant and handlers check. **Not** handler names. Each entry is a string or `{ code, description }` |
| `functions` | Backend handler names exported from `backend/src/index.ts` |
| `environment` | Environment variables the app reads via `ketrics.environment["NAME"]`. Created empty on deploy; mandatory while declared (undeletable and unrenameable in the portal, values editable) |
| `resources` | DocumentDB / Volume / Secret resources. Each binds to an environment variable — explicit via `environmentVariable` (which must be declared in `environment`), or derived from the kind and code (`exports` volume → `EXPORTS_VOLUME`, `apikey` secret → `APIKEY_SECRET`) |
| `roles` | Application roles to create; every action a role lists must appear in `actions` |

> `environmentVariables` was renamed to `environment`. The old key now fails deployment instead
> of being ignored.

When adding a handler: export it from `backend/src/index.ts`, guard it with
`requirePermission(...)`, and add its name to `functions`. Add to `actions` only when the handler
needs a genuinely new capability — and then add the same code to `PERMISSIONS` in
`backend/src/permissions.ts`, which is hand-synced with the config.

### Permissions

`backend/src/permissions.ts` declares the capabilities this app enforces and the typed guard
handlers call. Because `requirePermission` takes a `Permission` and not a `string`, a typo is a
compile error rather than a handler no role can reach.

| Capability | Guards |
| --- | --- |
| `read` | `echo`, `info`, `readFile`, `listFiles`, `generateDownloadUrl`, `queryUsers`, `getSecret`, `getJobStatus`, `fetchExternalApi` |
| `write` | `saveFile`, `copyFile`, `insertRecord`, `sendNotification`, `sendBulkNotification`, `scheduleBackgroundJob` |
| `export` | `createSimplePdf`, `createInvoicePdf`, `createSpreadsheet`, `exportDataToExcel` |
| `approve` | `transferFunds` |

`transferFunds` is guarded by `approve` rather than `write` on purpose: moving funds is a
capability you may want to grant separately from ordinary edits. The `approver` role in
`ketrics.config.json` grants `read` and `approve` without `write`.

### Required environment variables

Resource codes are never hardcoded in this template. `backend/src/config.ts` reads them from
`ketrics.environment` and throws a message naming the variable when one is unset, so configure
these in the portal before running the handlers:

| Variable | Bound to | Used by |
| --- | --- | --- |
| `DEMO_VOLUME` | `resources.volume` code `test-volume` | `saveFile`, `readFile`, `listFiles`, `generateDownloadUrl`, `copyFile`, both PDF handlers, both Excel handlers |
| `APIKEY_SECRET` | `resources.secret` code `apikey` (derived name) | `getSecret` (unless the payload passes an explicit `code`) |
| `DATABASE_CONNECTION` | `environment` entry — data connections are not a `resources` kind | `queryUsers`, `insertRecord`, `transferFunds` |

All three are created empty on deploy and cannot be deleted or renamed while declared.

## Deploy

```bash
ketrics deploy
```

## API Request Format

All function calls use the Runtime API with payload wrapped in a `payload` property:

```json
POST /tenants/{tenantId}/applications/{applicationId}/functions/{functionName}
{
  "payload": { "your": "data" }
}
```
