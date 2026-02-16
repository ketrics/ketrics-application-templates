# Ketrics Application Templates

Official starter templates for building applications on [Ketrics Cloud Analytics](https://www.ketrics.com). These templates are used by the `ketrics-cli` to scaffold new projects via `ketrics init`.

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

The `ketrics-cli` fetches `templates.json` from this repository to present available templates during `ketrics init`. When a user selects a template:

1. The template directory is downloaded and copied into the new project
2. Placeholders defined in `template.json` (e.g., `APP_NAME`) are replaced with user-provided values in the target files
3. Files listed in the `ignore` array (`node_modules`, `dist`, etc.) are excluded

## Template Anatomy

Every template contains:

| File                  | Purpose                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `ketrics.config.json` | Application configuration — name, version, runtime, actions, entry point, and include/exclude globs |
| `template.json`       | Template metadata — display name, description, author, SDK version, placeholders, and ignored files |
| `backend/`            | TypeScript handler functions that run on the Ketrics Runtime API                                    |
| `frontend/`           | React + TypeScript + Vite frontend with mock handlers for local development                         |
| `tests/`              | JSON files defining test request payloads for each backend function                                 |

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
      "minCliVersion": "0.5.0",
      "minSdkVersion": "0.11.0",
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
