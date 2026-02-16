#!/usr/bin/env node

/**
 * Validate templates.json manifest
 *
 * Checks:
 * - Valid JSON
 * - Has required fields (version, templates array)
 * - Each template entry has required fields
 * - Template paths point to existing directories
 * - No duplicate template names
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'templates.json');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

// Read and parse manifest
if (!fs.existsSync(MANIFEST_PATH)) {
  fail('templates.json not found at repository root');
}

let manifest;
try {
  const content = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  manifest = JSON.parse(content);
} catch (err) {
  fail(`templates.json is not valid JSON: ${err.message}`);
}

// Validate top-level structure
if (typeof manifest.version !== 'number') {
  fail('templates.json must have a numeric "version" field');
}
pass(`Manifest version: ${manifest.version}`);

if (!Array.isArray(manifest.templates)) {
  fail('templates.json must have a "templates" array');
}
pass(`Found ${manifest.templates.length} template(s)`);

// Required fields for each template entry
const REQUIRED_FIELDS = ['name', 'description', 'path', 'minCliVersion', 'minSdkVersion', 'tags'];

const names = new Set();

for (const template of manifest.templates) {
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (template[field] === undefined || template[field] === null) {
      fail(`Template "${template.name || 'unknown'}": missing required field "${field}"`);
    }
  }

  // Check for duplicate names
  if (names.has(template.name)) {
    fail(`Duplicate template name: "${template.name}"`);
  }
  names.add(template.name);

  // Check path exists
  const templateDir = path.join(ROOT, template.path);
  if (!fs.existsSync(templateDir)) {
    fail(`Template "${template.name}": path "${template.path}" does not exist`);
  }

  // Check tags is an array
  if (!Array.isArray(template.tags)) {
    fail(`Template "${template.name}": "tags" must be an array`);
  }

  // Check semver format for version fields
  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!semverRegex.test(template.minCliVersion)) {
    fail(`Template "${template.name}": "minCliVersion" must be semver format (got "${template.minCliVersion}")`);
  }
  if (!semverRegex.test(template.minSdkVersion)) {
    fail(`Template "${template.name}": "minSdkVersion" must be semver format (got "${template.minSdkVersion}")`);
  }

  pass(`Template "${template.name}": valid`);
}

console.log('\nAll manifest validations passed.');
