# Ketrics Application Templates

Official starter templates for building applications on [Ketrics Cloud Analytics](https://www.ketrics.com). These templates are used by the `ketrics-cli` to scaffold new projects via `ketrics init`.

> **Repository:** `ketrics/ketrics-application-templates` (branch: `main`)
> The CLI fetches templates from `https://github.com/ketrics/ketrics-application-templates` on the `main` branch. It no longer bundles a copy of its own.

## Available Templates

| Template       | Description                                                                                                                                                          | Tags                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **HelloWorld** | Complete reference app demonstrating all SDK features including volumes, databases, PDF/Excel generation, secrets, messaging, background jobs, and HTTP integrations | `full`, `reference`  |
| **Blank**      | Minimal starter with a single echo handler — a clean starting point for new applications                                                                             | `minimal`, `starter` |

## Repository Structure

```
├── templates.json              # Template manifest (consumed by ketrics-cli)
├── templates/
│   ├── HelloWorld/             # Full-featured reference template
│   │   ├── ketrics.config.json
│   │   ├── template.json
│   │   ├── backend/            # TypeScript handlers (volumes, database, PDF, Excel, etc.)
│   │   ├── frontend/           # React + Vite frontend with mock handlers
│   │   └── tests/              # Test request JSON files
│   └── Blank/                  # Minimal starter template
│       ├── ketrics.config.json
│       ├── template.json
│       ├── backend/            # Single echo handler
│       ├── frontend/           # React + Vite frontend
│       └── tests/
├── scripts/
│   ├── validate-manifest.js    # Validates templates.json structure
│   └── validate-templates.js   # Validates individual template structure
├── CONTRIBUTING.md             # Guide for adding new templates
└── .github/
    └── workflows/
        └── validate-templates.yml  # CI pipeline for template validation
```

## How It Works

The `ketrics-cli` fetches `templates.json` from `ketrics/ketrics-application-templates` (branch `main`) to present available templates during `ketrics init`. When a user selects a template:

1. The template directory is downloaded and copied into the new project
2. Placeholders defined in `template.json` (e.g., `APP_NAME`) are replaced with user-provided values in the target files
3. Files listed in the `ignore` array (`node_modules`, `dist`, etc.) are excluded

## Template Anatomy

Every template contains:

| File                  | Purpose                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ketrics.config.json` | Application configuration — name, version, runtime, entry point, include/exclude globs, capabilities (`actions`), handler names (`functions`), `environment`, `resources` and `roles` |
| `template.json`       | Template metadata — display name, description, author, SDK version, placeholders, and ignored files                                                                                  |
| `backend/`            | TypeScript handler functions that run on the Ketrics Runtime API                                                                                                                     |
| `frontend/`           | React + TypeScript + Vite frontend with mock handlers for local development                                                                                                          |
| `tests/`              | JSON files defining test request payloads for each backend function                                                                                                                  |

## ketrics.config.json

Every template ships a `ketrics.config.json`. The App Deployment Lambda reads it on each deploy and syncs the Application record from it:

```json
{
  "name": "app",
  "version": "1.0.0",
  "runtime": "nodejs18",
  "entry": "dist/index.js",
  "include": ["dist/**/*"],
  "actions": [
    { "code": "read", "description": "View application data" },
    { "code": "write", "description": "Create and modify application data" }
  ],
  "functions": ["getPermissions", "listItems", "createItem", "exportExcel"],
  "environment": [
    { "name": "SOFTLAND_API_URL", "description": "Base URL of the ERP API" }
  ],
  "resources": {
    "documentdb": [{ "code": "app-data", "description": "Main data store" }],
    "volume": [{ "code": "exports", "description": "Excel and PDF exports" }],
    "connection": [{ "code": "main-db", "description": "SQL data connection" }]
  },
  "roles": [
    { "code": "viewer", "name": "Viewer", "actions": ["read"] }
  ]
}
```

| Field         | Purpose                                                                                                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actions`     | **Capabilities** (`read`, `write`, `export`) — the vocabulary roles grant and handlers check with `requirePermission`. Required. Never handler names. Each entry is a bare string or `{ code, description }`          |
| `functions`   | Backend handler names exported from `backend/src/index.ts` (metadata)                                                                                                                                                |
| `environment` | Environment variables the app reads via `ketrics.environment["NAME"]`. Created empty on deploy, existing values never overwritten. Mandatory while declared: undeletable and unrenameable in the portal, values editable |
| `resources`   | Ketrics-managed resources under five kinds: `documentdb`, `volume`, `secret`, `parameter`, `connection`. Each has a `code`, an optional `description`, and an optional `environmentVariable`. Declaring one is what grants the app access to it |
| `roles`       | Application roles to create. Every action a role lists must appear in the top-level `actions`                                                                                                                        |

When a resource omits `environmentVariable`, the platform derives the name: uppercase the `code`, replace non-alphanumerics with `_`, then append the kind's suffix — `app-data` (documentdb) → `APP_DATA_DOCDB`, `exports` (volume) → `EXPORTS_VOLUME`, `stripe-key` (secret) → `STRIPE_KEY_SECRET`, `billing-config` (parameter) → `BILLING_CONFIG_PARAMETER`, `main-db` (connection) → `MAIN_DB_CONNECTION`. A derived name does not need an `environment` entry. When `environmentVariable` is given, it must be declared in `environment`.

The rule for choosing: if the value names a Ketrics-managed object of one of the five kinds, it is a `resources` entry (the portal renders a picker for it and deploy seeds the matching grant); if it is a plain value the app just needs — a threshold, a base URL, a flag — it is an `environment` entry. SQL data connections belong under `resources.connection`, which needs CLI >= 0.14.0.

> **Renamed:** `environmentVariables` is now `environment`. The old key is rejected at deploy time rather than silently ignored.

## templates.json Manifest

The root `templates.json` is the registry consumed by `ketrics-cli`:

```json
{
  "version": 1,
  "templates": [
    {
      "name": "HelloWorld",
      "description": "Complete reference app with all SDK features",
      "path": "templates/HelloWorld",
      "minCliVersion": "0.14.0",
      "minSdkVersion": "0.17.0",
      "tags": ["full", "reference"]
    }
  ]
}
```

Each entry specifies the minimum CLI and SDK versions required to use the template.

## Validation

Two validation scripts ensure template integrity:

```bash
# Validate the templates.json manifest (structure, required fields, paths, no duplicates)
node scripts/validate-manifest.js

# Validate all templates (or a specific one)
node scripts/validate-templates.js
node scripts/validate-templates.js HelloWorld
```

These run automatically in CI on any PR or push that modifies `templates/` or `templates.json`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide on adding or updating templates.
