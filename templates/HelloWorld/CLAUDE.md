# Development instructions

A Ketrics tenant application: a TypeScript backend of handler functions plus a React frontend
embedded as an iframe. `ketrics.config.json` at the root declares the app to the platform.

This template is a reference app — every domain file demonstrates one SDK subsystem. Delete the
ones you do not need (and their `functions` entries, mocks and tests) rather than leaving handlers
nobody calls.

## Layout

```
ketrics.config.json      # actions, roles, functions, environment, resources
backend/src/
  index.ts               # re-exports ONLY — the manifest of callable handlers
  types.ts               # shared interfaces, no runtime code
  permissions.ts         # PERMISSIONS + typed requirePermission + getPermissions
  helpers.ts             # env/resource accessors, attachmentDisposition
  logger.ts              # DEBUG_LEVEL-gated logger
  general.ts             # echo, info
  documents.ts           # DocumentDB (pk/sk CRUD, cursor pagination)
  volumes.ts             # Volume file storage
  database.ts            # SQL data connections
  parameters.ts          # shared JSON configuration
  secrets.ts             # encrypted secrets
  pdf.ts  excel.ts       # document generation
  messages.ts  jobs.ts   # notifications, background jobs
  http.ts                # external HTTP requests
frontend/src/
  App.tsx  types.ts  services/index.ts  mocks/handlers.ts
```

## Rules that are easy to get wrong

- **`index.ts` holds no logic.** It imports handlers from domain files and re-exports them, and
  every name in the config's `functions` array must appear there — including `_processInBackground`
  and any other background handler prefixed with `_`. Add a new domain file per feature area;
  esbuild bundles the whole `src/` tree into one `dist/index.js`, so extra files cost nothing.
- **`actions` are capabilities, not handler names and not role names.** Handler names go in
  `functions`; roles compose capabilities. Note `approver` grants `approve` without `write` — a
  separation of duties role-shaped actions cannot express. Add a capability only when a guard needs
  it; if only the audience changes, add a role.
- **`PERMISSIONS` in `permissions.ts` and `actions` in the config are hand-synced.** Nothing
  verifies them at runtime; edit both in the same commit. (`node scripts/validate-templates.js` in
  the templates repo does compare them.)
- **Every handler calls `requirePermission(...)` on its first line** — except background handlers,
  which have no interactive requestor; guard the handler that schedules the job instead.
- **Never hardcode a resource code.** Declare the resource under its kind — `documentdb`, `volume`,
  `secret`, `parameter`, `connection` — and read the bound variable through an accessor in
  `helpers.ts`. Never fall back to a literal default.
- **Always pass `responseContentDisposition: attachmentDisposition(filename)`** to
  `generateDownloadUrl`. The frontend iframe runs under `frame-src https://cdn.ketrics.io`;
  a presigned S3 URL without a forced attachment is blocked by the CSP and fails silently.
- **Credentials go in a `secret`, never in a `parameter`.** Parameter values are stored in
  plaintext and are readable by anyone holding `parameter:DescribeParameter` for a matching
  pattern.
- **`ketrics.http` does not throw on non-2xx.** It returns the response with the error status, so
  log `response.status` or a quiet 401 looks identical to an empty result.
- **The config key is `environment`.** The legacy `environmentVariables` key fails the deploy.

## Commands

```bash
cd backend  && npm install && npm run build      # esbuild -> dist/index.js
cd backend  && npm run typecheck                 # tsc --noEmit; catches typo'd permissions
cd frontend && npm install && npm run dev        # Vite + mock handlers, no backend needed
cd frontend && npm run build                     # tsc && vite build

npm install -g @ketrics/ketrics-cli@latest       # Node >= 24; NEVER install unpinned
ketrics --version                                # if this prints 0.1.0, upgrade Node and reinstall
ketrics deploy --env .env
```

## Adding a handler

1. Write it in the relevant domain file (or a new one), guarded with `requirePermission(...)`.
2. Re-export it from `backend/src/index.ts`.
3. Add its name to `functions` in `ketrics.config.json`.
4. Add a mock to `frontend/src/mocks/handlers.ts` under the exact same name.
5. Call it with `apiClient.run("handlerName", payload)`.

## After deploying

Fill in the environment variable values and pick the resources in the Ketrics dashboard, then
confirm the app's actions, roles and variables actually changed. A 0.1.0 CLI reports a successful
deploy while shipping a ZIP with no config in it.
