# Ketrics Application — Blank Template

A minimal starter template for building applications on the Ketrics platform.

## Structure

```
├── ketrics.config.json    # Application configuration
├── backend/               # TypeScript handlers for Runtime API
│   └── src/
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
2. Export it from `backend/src/index.ts`
3. Add the function name to the `actions` array in `ketrics.config.json`
4. Add a mock handler in `frontend/src/mocks/handlers.ts`
5. Call it from the frontend using `apiClient.run("functionName", payload)`

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
