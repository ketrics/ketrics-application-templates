# Contributing to Ketrics Application Templates

Thank you for your interest in contributing templates to the Ketrics platform!

## Adding a New Template

### 1. Create the template directory

```
templates/
└── YourTemplateName/
    ├── ketrics.config.json    # Required: Ketrics app configuration
    ├── template.json          # Required: Template metadata and placeholders
    ├── README.md              # Required: Template documentation
    ├── .env.example           # Required: Environment variables template
    ├── .npmrc                 # Required: engine-strict=true
    ├── backend/
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── index.ts       # Handler functions
    │       └── permissions.ts # PERMISSIONS + typed requirePermission guard
    ├── frontend/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── vite.config.ts
    │   ├── index.html
    │   └── src/
    │       ├── App.tsx
    │       ├── main.tsx
    │       ├── services/
    │       │   └── index.ts
    │       └── mocks/
    │           ├── handlers.ts
    │           └── mock-client.ts
    └── tests/                  # Optional: Test request JSON files
```

### 2. Create `template.json`

Every template must include a `template.json` file with metadata and placeholder definitions:

```json
{
  "displayName": "Your Template Name",
  "description": "A brief description of what this template does",
  "author": "Your Name",
  "sdkVersion": "0.11.0",
  "placeholders": {
    "APP_NAME": {
      "description": "Application name",
      "files": [
        "ketrics.config.json",
        "frontend/package.json",
        "backend/package.json"
      ],
      "jsonField": "name"
    }
  },
  "ignore": [
    "node_modules",
    ".git",
    "dist",
    "package-lock.json"
  ]
}
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `displayName` | Yes | Human-readable template name |
| `description` | Yes | What this template demonstrates or provides |
| `author` | Yes | Template author name |
| `sdkVersion` | Yes | Minimum `@ketrics/sdk-backend` version required |
| `placeholders` | Yes | Defines which files and fields get customized (at minimum, `APP_NAME`) |
| `ignore` | Yes | Files/directories to exclude when copying |

### 3. Create `ketrics.config.json`

This file is what the App Deployment Lambda reads to sync the Application record, so a template's config is the example every generated app inherits. Get it right:

```json
{
  "name": "app",
  "version": "1.0.0",
  "description": "My Ketrics application",
  "runtime": "nodejs18",
  "entry": "dist/index.js",
  "include": ["dist/**/*"],
  "exclude": ["node_modules", "*.test.js", "*.spec.js"],
  "actions": [
    { "code": "read", "description": "View application data" },
    { "code": "write", "description": "Create and modify application data" }
  ],
  "functions": ["echo"],
  "environment": [
    { "name": "WELCOME_MESSAGE", "description": "Example variable" }
  ],
  "resources": {
    "volume": [{ "code": "files", "description": "File storage" }]
  },
  "roles": [
    { "code": "viewer", "name": "Viewer", "actions": ["read"] },
    { "code": "editor", "name": "Editor", "actions": ["read", "write"] }
  ]
}
```

**Fields:**

| Field                                             | Required | Description                                                                                                                                        |
| ------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `version`, `runtime`, `entry`, `include`  | Yes      | Identity, runtime and packaging                                                                                                                    |
| `description`, `exclude`                          | No       | Description and packaging exclusions                                                                                                               |
| `actions`                                         | Yes      | **Capabilities** roles grant and handlers check — `read`, `write`, `export`. Max 50. Never handler names. Each entry is a bare string or `{ code, description }` |
| `functions`                                       | No       | Backend handler names exported from `backend/src/index.ts`                                                                                         |
| `environment`                                     | No       | `{ name, description }` entries, max 50. `name` must match `/^[A-Z][A-Z0-9_]*$/` and be unique                                                     |
| `resources`                                       | No       | `documentdb` / `volume` / `secret` arrays; each entry needs a `code` unique within its kind                                                         |
| `roles`                                           | No       | Max 20. `code` unique and matching `/^[a-zA-Z][a-zA-Z0-9_-]*$/`, non-empty `name`, and `actions` drawn from the top-level `actions`                 |

Rules to respect when authoring a template config:

- **`actions` are capabilities, not handler names and not role names.** Handler names belong in `functions`; role names belong in `roles`. Listing handlers under `actions` pollutes every tenant's permission model.
- **Ship a `backend/src/permissions.ts` whose `PERMISSIONS` matches `actions` exactly.** Every guarded handler calls `requirePermission(...)`; the typed parameter turns a typo into a compile error. `scripts/validate-templates.js` checks this pairing.
- **Use `environment`, not `environmentVariables`.** The legacy key is now a hard deployment error.
- **Resource bindings are optional.** `resources[].environmentVariable` may be omitted, in which case the name is derived — uppercase the `code`, non-alphanumerics to `_`, then `_DOCDB` / `_VOLUME` / `_SECRET` (`app-data` → `APP_DATA_DOCDB`, `exports` → `EXPORTS_VOLUME`). If you do declare it, it must also appear in `environment`.
- **Declare only what the template actually uses.** Every declared variable — from `environment` or from a resource binding — is created empty on deploy and becomes mandatory: tenants cannot delete or rename it while the config declares it.
- **Never hardcode resource codes in handler source**; read them from `ketrics.environment["VAR_NAME"]`.

### 4. Update `templates.json`

Add your template to the root `templates.json` manifest:

```json
{
  "name": "YourTemplateName",
  "description": "Short description for the CLI selection menu",
  "path": "templates/YourTemplateName",
  "minCliVersion": "0.5.0",
  "minSdkVersion": "0.11.0",
  "tags": ["your", "tags"]
}
```

### 5. Ensure it builds

Before submitting, verify the manifest, the template structure and the builds:

```bash
node scripts/validate-manifest.js
node scripts/validate-templates.js YourTemplateName

cd templates/YourTemplateName/backend && npm install && npm run build
cd ../frontend && npm install && npm run build
```

`npm run build` is esbuild, which bundles without type checking. Run `npx tsc --noEmit` in the backend as well if you want type errors surfaced.

## Updating an Existing Template

1. Make your changes in the template directory
2. If SDK dependencies changed, update `sdkVersion` in `template.json` and `minSdkVersion` in `templates.json`
3. Ensure the template still builds successfully

## Guidelines

- **Keep templates focused**: Each template should demonstrate a specific use case or pattern
- **Use the default app name**: Use `"app"` as the default name in `ketrics.config.json` and `package.json` files — the CLI replaces it via placeholders
- **Include mock handlers**: Always provide mock handlers in `frontend/src/mocks/handlers.ts` so the frontend works in dev mode without a backend
- **Document your template**: Include a `README.md` explaining the template's purpose, structure, and all backend functions
- **Include test files**: Add JSON test request files in the `tests/` directory for each backend function
- **Don't include build artifacts**: Never commit `node_modules/`, `dist/`, or `package-lock.json`
- **Pin SDK versions**: Use exact versions for `@ketrics/sdk-backend` in devDependencies

## Pull Request Process

1. Fork this repository
2. Create a feature branch: `git checkout -b add-template-name`
3. Add or update your template following the guidelines above
4. Ensure CI validation passes (template builds successfully)
5. Submit a pull request with a description of your template

## Template Tags

Use these standard tags when applicable:

| Tag | Description |
|-----|-------------|
| `full` | Comprehensive template with many features |
| `reference` | Official reference implementation |
| `minimal` | Bare minimum to get started |
| `starter` | Good starting point for new projects |
| `crud` | Demonstrates Create/Read/Update/Delete operations |
| `database` | Focuses on database operations |
| `documents` | PDF/Excel generation focused |
| `storage` | Volume/file storage focused |
