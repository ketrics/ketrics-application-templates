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
 * - template.json exists and has required fields
 * - backend/package.json exists
 * - frontend/package.json exists
 * - backend/src/index.ts exists
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
