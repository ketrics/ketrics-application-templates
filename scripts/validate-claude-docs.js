#!/usr/bin/env node

/**
 * Validate the Claude Code files shipped in every template
 *
 * Usage: node scripts/validate-claude-docs.js
 *
 * Checks, for each template listed in templates.json:
 * - CLAUDE.md has exactly one shared block, between <!-- shared:start --> and
 *   <!-- shared:end -->, with the four team sections
 * - the shared block is byte-identical across all templates
 * - CLAUDE.md does not pin the Ketrics CLI to @latest
 * - .claude/settings.json parses, has a model, asks before deploy and push, and denies .env
 * - .claude/agents/ketrics-implementer.md has frontmatter with name and model
 * - .gitignore ignores .claude/settings.local.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'templates.json');

const SHARED_START = '<!-- shared:start -->';
const SHARED_END = '<!-- shared:end -->';
const REQUIRED_HEADINGS = [
  '## Working as a team',
  '## Reading a spec issue',
  '## Installing the Ketrics skill',
  '## Deploy and versioning',
];

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function readText(file, label) {
  if (!fs.existsSync(file)) {
    fail(`${label}: ${path.relative(ROOT, file)} does not exist`);
  }
  return fs.readFileSync(file, 'utf-8');
}

function countOccurrences(text, needle) {
  return text.split(needle).length - 1;
}

/**
 * Return the shared block exactly as written, markers included.
 */
function sharedBlock(name, claudeMd) {
  if (countOccurrences(claudeMd, SHARED_START) !== 1 || countOccurrences(claudeMd, SHARED_END) !== 1) {
    fail(`${name}: CLAUDE.md must contain exactly one ${SHARED_START} ... ${SHARED_END} block`);
  }

  const start = claudeMd.indexOf(SHARED_START);
  const end = claudeMd.indexOf(SHARED_END) + SHARED_END.length;

  if (end <= start) {
    fail(`${name}: CLAUDE.md shared block end marker comes before its start marker`);
  }

  return claudeMd.slice(start, end);
}

function validateClaudeMd(name, claudeMd) {
  for (const heading of REQUIRED_HEADINGS) {
    if (!claudeMd.includes(`\n${heading}\n`)) {
      fail(`${name}: CLAUDE.md is missing the "${heading}" section`);
    }
  }

  if (claudeMd.includes('ketrics-cli@latest')) {
    fail(`${name}: CLAUDE.md pins the Ketrics CLI to @latest; pin it to a range such as @^0.15`);
  }

  pass(`${name}: CLAUDE.md has the shared block and the four team sections`);
}

function validateSettings(name, settingsPath) {
  const text = readText(settingsPath, name);

  let settings;
  try {
    settings = JSON.parse(text);
  } catch (error) {
    fail(`${name}: .claude/settings.json is not valid JSON (${error.message})`);
  }

  if (typeof settings.model !== 'string' || settings.model.length === 0) {
    fail(`${name}: .claude/settings.json must set a "model" string`);
  }

  const ask = (settings.permissions && settings.permissions.ask) || [];
  if (!ask.includes('Bash(ketrics deploy:*)')) {
    fail(`${name}: .claude/settings.json must ask before "Bash(ketrics deploy:*)"`);
  }

  const deny = (settings.permissions && settings.permissions.deny) || [];
  if (!deny.includes('Read(./.env)')) {
    fail(`${name}: .claude/settings.json must deny "Read(./.env)"`);
  }

  pass(`${name}: .claude/settings.json is valid and asks before deploy`);
}

function validateAgent(name, agentPath) {
  const text = readText(agentPath, name);
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);

  if (!frontmatter) {
    fail(`${name}: .claude/agents/ketrics-implementer.md must start with --- frontmatter`);
  }
  if (!/^name: ketrics-implementer$/m.test(frontmatter[1])) {
    fail(`${name}: ketrics-implementer.md frontmatter must set "name: ketrics-implementer"`);
  }
  if (!/^model: .+$/m.test(frontmatter[1])) {
    fail(`${name}: ketrics-implementer.md frontmatter must set a "model"`);
  }

  pass(`${name}: .claude/agents/ketrics-implementer.md has valid frontmatter`);
}

function validateGitignore(name, gitignorePath) {
  const lines = readText(gitignorePath, name).split('\n').map((line) => line.trim());

  if (!lines.includes('.claude/settings.local.json')) {
    fail(`${name}: .gitignore must ignore .claude/settings.local.json`);
  }

  pass(`${name}: .gitignore ignores .claude/settings.local.json`);
}

// Read and parse manifest
const manifest = JSON.parse(readText(MANIFEST_PATH, 'templates.json'));

let reference = null;
let referenceName = null;

for (const template of manifest.templates) {
  const name = template.name;
  const dir = path.join(ROOT, template.path);

  const claudeMd = readText(path.join(dir, 'CLAUDE.md'), name);
  validateClaudeMd(name, claudeMd);

  const block = sharedBlock(name, claudeMd);
  if (reference === null) {
    reference = block;
    referenceName = name;
  } else if (block !== reference) {
    fail(`${name}: shared block differs from ${referenceName}; keep the four team sections identical`);
  }

  validateSettings(name, path.join(dir, '.claude', 'settings.json'));
  validateAgent(name, path.join(dir, '.claude', 'agents', 'ketrics-implementer.md'));
  validateGitignore(name, path.join(dir, '.gitignore'));
}

pass(`shared block is identical across ${manifest.templates.length} templates`);
