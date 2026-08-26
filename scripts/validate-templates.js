#!/usr/bin/env node

/**
 * Validate individual template structure
 *
 * Usage: node scripts/validate-templates.js [template-name]
 *
 * If template-name is provided, validates only that template.
 * Otherwise validates all templates listed in templates.json.
 *
 * Checks:
 * - ketrics.config.json exists and has required fields
 * - actions are capabilities, and roles only grant declared actions
 * - actions match the PERMISSIONS tuple in backend/src/permissions.ts
 * - template.json exists and has required fields
 * - backend/package.json exists
 * - frontend/package.json exists
 * - backend/src/index.ts exists
 * - backend/src/permissions.ts exists
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEMPLATES_DIR = path.join(ROOT, 'templates');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

/**
 * Read the action codes from a config. Entries are either a bare string or
 * an object with a "code" — both shapes are valid in the v2 config.
 */
function actionCodes(templateName, actions) {
  return actions.map((action, i) => {
    if (typeof action === 'string') {
      return action;
    }

    if (action && typeof action === 'object' && typeof action.code === 'string') {
      return action.code;
    }

    fail(
      `${templateName}: ketrics.config.json "actions[${i}]" must be a string or an object with a "code"`,
    );
  });
}

/**
 * Read the PERMISSIONS tuple out of backend/src/permissions.ts.
 *
 * The tuple and the config's "actions" are hand-synced — a drift means a
 * handler guards on a capability no role can grant, so it is worth catching
 * here rather than in production. Parsed by regex to keep this script
 * dependency-free and able to read TypeScript.
 */
function permissionCodes(templateName, permissionsPath) {
  const source = fs.readFileSync(permissionsPath, 'utf-8');
  const match = source.match(/export\s+const\s+PERMISSIONS\s*=\s*\[([^\]]*)\]/);

  if (!match) {
    fail(`${templateName}: backend/src/permissions.ts does not export a PERMISSIONS array`);
  }

  return match[1]
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const quoted = entry.match(/^["'](.+)["']$/);
      if (!quoted) {
        fail(`${templateName}: PERMISSIONS entry ${entry} is not a plain string literal`);
      }
      return quoted[1];
    });
}

function validateTemplate(templateName) {
  const templateDir = path.join(TEMPLATES_DIR, templateName);

  if (!fs.existsSync(templateDir)) {
    fail(`Template directory not found: ${templateDir}`);
  }

  // Check ketrics.config.json
  const configPath = path.join(templateDir, 'ketrics.config.json');
  if (!fs.existsSync(configPath)) {
    fail(`${templateName}: missing ketrics.config.json`);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (err) {
    fail(`${templateName}: ketrics.config.json is not valid JSON: ${err.message}`);
  }

  const configRequired = ['name', 'version', 'runtime', 'actions', 'entry', 'include'];
  for (const field of configRequired) {
    if (config[field] === undefined) {
      fail(`${templateName}: ketrics.config.json missing required field "${field}"`);
    }
  }

  if (!Array.isArray(config.actions) || config.actions.length === 0) {
    fail(`${templateName}: ketrics.config.json "actions" must be a non-empty array`);
  }

  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!semverRegex.test(config.version)) {
    fail(`${templateName}: ketrics.config.json "version" must be semver format`);
  }

  // "environmentVariables" was renamed to "environment" and is now rejected at
  // deploy time, so catch it here rather than shipping a template that fails.
  if (config.environmentVariables !== undefined) {
    fail(
      `${templateName}: ketrics.config.json uses the removed "environmentVariables" key — rename it to "environment"`,
    );
  }

  const declaredActions = actionCodes(templateName, config.actions);

  const duplicateAction = declaredActions.find(
    (code, i) => declaredActions.indexOf(code) !== i,
  );
  if (duplicateAction) {
    fail(`${templateName}: ketrics.config.json declares action "${duplicateAction}" more than once`);
  }

  // Every action a role grants must be a declared capability, otherwise the
  // role hands out something no handler can ever check.
  if (config.roles !== undefined) {
    if (!Array.isArray(config.roles)) {
      fail(`${templateName}: ketrics.config.json "roles" must be an array`);
    }

    for (const role of config.roles) {
      if (!role || typeof role.code !== 'string' || !role.code) {
        fail(`${templateName}: ketrics.config.json each role needs a non-empty "code"`);
      }

      if (!Array.isArray(role.actions)) {
        fail(`${templateName}: ketrics.config.json role "${role.code}" needs an "actions" array`);
      }

      for (const action of role.actions) {
        if (!declaredActions.includes(action)) {
          fail(
            `${templateName}: role "${role.code}" grants action "${action}", which is not declared in "actions"`,
          );
        }
      }
    }

    pass(`${templateName}: every role action is a declared capability`);
  }

  pass(`${templateName}: ketrics.config.json valid`);

  // Check template.json
  const templateJsonPath = path.join(templateDir, 'template.json');
  if (!fs.existsSync(templateJsonPath)) {
    fail(`${templateName}: missing template.json`);
  }

  let templateConfig;
  try {
    templateConfig = JSON.parse(fs.readFileSync(templateJsonPath, 'utf-8'));
  } catch (err) {
    fail(`${templateName}: template.json is not valid JSON: ${err.message}`);
  }

  const templateRequired = ['displayName', 'description', 'author', 'sdkVersion', 'placeholders', 'ignore'];
  for (const field of templateRequired) {
    if (templateConfig[field] === undefined) {
      fail(`${templateName}: template.json missing required field "${field}"`);
    }
  }

  // Validate placeholders structure
  if (typeof templateConfig.placeholders !== 'object' || templateConfig.placeholders === null) {
    fail(`${templateName}: template.json "placeholders" must be an object`);
  }

  if (!templateConfig.placeholders.APP_NAME) {
    fail(`${templateName}: template.json must define an "APP_NAME" placeholder`);
  }

  pass(`${templateName}: template.json valid`);

  // Check backend
  const backendPackage = path.join(templateDir, 'backend', 'package.json');
  if (!fs.existsSync(backendPackage)) {
    fail(`${templateName}: missing backend/package.json`);
  }
  pass(`${templateName}: backend/package.json exists`);

  const backendIndex = path.join(templateDir, 'backend', 'src', 'index.ts');
  if (!fs.existsSync(backendIndex)) {
    fail(`${templateName}: missing backend/src/index.ts`);
  }
  pass(`${templateName}: backend/src/index.ts exists`);

  // The PERMISSIONS tuple and the config's "actions" are hand-synced. Nothing
  // at runtime notices when they drift, so compare them here.
  const permissionsPath = path.join(templateDir, 'backend', 'src', 'permissions.ts');
  if (!fs.existsSync(permissionsPath)) {
    fail(`${templateName}: missing backend/src/permissions.ts`);
  }

  const declaredPermissions = permissionCodes(templateName, permissionsPath);

  const missingFromPermissions = declaredActions.filter((a) => !declaredPermissions.includes(a));
  const missingFromActions = declaredPermissions.filter((p) => !declaredActions.includes(p));

  if (missingFromPermissions.length > 0 || missingFromActions.length > 0) {
    const details = [];
    if (missingFromPermissions.length > 0) {
      details.push(`declared in "actions" but not in PERMISSIONS: ${missingFromPermissions.join(', ')}`);
    }
    if (missingFromActions.length > 0) {
      details.push(`declared in PERMISSIONS but not in "actions": ${missingFromActions.join(', ')}`);
    }
    fail(`${templateName}: actions and PERMISSIONS are out of sync — ${details.join('; ')}`);
  }

  pass(`${templateName}: actions match backend/src/permissions.ts PERMISSIONS`);

  // Check frontend
  const frontendPackage = path.join(templateDir, 'frontend', 'package.json');
  if (!fs.existsSync(frontendPackage)) {
    fail(`${templateName}: missing frontend/package.json`);
  }
  pass(`${templateName}: frontend/package.json exists`);

  console.log(`\n${templateName}: All validations passed.\n`);
}

// Main
const targetTemplate = process.argv[2];

if (targetTemplate) {
  validateTemplate(targetTemplate);
} else {
  // Validate all templates from manifest
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'templates.json'), 'utf-8'));
  for (const template of manifest.templates) {
    validateTemplate(template.name);
  }
}
