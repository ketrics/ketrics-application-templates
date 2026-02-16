# Ketrics Application Template

A starter template for building applications on the Ketrics platform, demonstrating all SDK features.

## Structure

```
├── ketrics.config.json    # Application configuration
├── backend/               # TypeScript handlers for Runtime API
│   └── src/
│       ├── index.ts       # Main exports (echo, info)
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
