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
    ├── backend/
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       └── index.ts       # Handler functions
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

### 3. Update `templates.json`

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

### 4. Ensure it builds

Before submitting, verify your template compiles:

```bash
cd templates/YourTemplateName/backend && npm install && npm run build
cd ../frontend && npm install && npm run build
```

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
