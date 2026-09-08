# Development instructions

A Ketrics tenant application: a TypeScript backend of handler functions plus a React frontend
embedded as an iframe. `ketrics.config.json` at the root declares the app to the platform.

## Layout

```
ketrics.config.json      # actions, roles, functions, environment, resources
backend/src/
  index.ts               # re-exports ONLY — the manifest of callable handlers
  types.ts               # shared interfaces, no runtime code
  permissions.ts         # PERMISSIONS + typed requirePermission + getPermissions
  helpers.ts             # cross-cutting utilities (env accessors)
  logger.ts              # DEBUG_LEVEL-gated logger
  greeting.ts            # domain file
  notifications.ts       # domain file
frontend/src/
  App.tsx  types.ts  services/index.ts  mocks/handlers.ts
```

## Rules that are easy to get wrong

- **`index.ts` holds no logic.** It imports handlers from domain files and re-exports them, and
  every name in the config's `functions` array must appear there — including background handlers
  prefixed with `_`. Add a new domain file per feature area rather than growing `index.ts`;
  esbuild bundles the whole `src/` tree into one `dist/index.js`, so extra files cost nothing.
- **`actions` are capabilities, not handler names and not role names.** Handler names go in
  `functions`; roles compose capabilities. Add a capability only when a guard needs it — if only
  the audience changes, add a role.
- **`PERMISSIONS` in `permissions.ts` and `actions` in the config are hand-synced.** Nothing
  verifies them at runtime; edit both in the same commit. (`node scripts/validate-templates.js`
  in the templates repo does compare them.)
- **Every handler calls `requirePermission(...)` on its first line.** Hiding a button via
  `getPermissions` is a convenience, never a control.
- **Never hardcode a resource code.** Declare the resource in `ketrics.config.json` under its kind
  — `documentdb`, `volume`, `secret`, `parameter` or `connection` — and read the bound variable
  through an accessor in `helpers.ts`. Never fall back to a literal default.
- **`environment` vs `resources`:** the code of a Ketrics-managed resource is a `resources` entry
  (it gets a picker in the portal and an auto-granted permission); plain values — thresholds,
  URLs, flags — are `environment` entries. Every declared variable becomes a mandatory row in the
  tenant's portal, so declare only what the app actually reads.
- **Credentials go in a `secret`, never in a `parameter`.** Parameter values are stored in
  plaintext.
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

Confirm the app's actions, roles and variables actually changed in the portal. A 0.1.0 CLI
reports a successful deploy while shipping a ZIP with no config in it.
