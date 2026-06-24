#!/usr/bin/env node
/**
 * scripts/bump-deploy-meta.mjs
 *
 * Updates src/deploy-meta.js before a manual deploy.
 *
 * Usage:
 *   node scripts/bump-deploy-meta.mjs <checkpoint> <baseline>
 *
 * Example:
 *   node scripts/bump-deploy-meta.mjs D-151A 1028/24/57
 *
 * Does NOT deploy. Does NOT read secrets or env.
 */

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Validate args ─────────────────────────────────────────────────────────────

const [checkpoint, baseline] = process.argv.slice(2);

if (!checkpoint) {
  console.error('Error: checkpoint label is required.');
  console.error('Usage: node scripts/bump-deploy-meta.mjs <checkpoint> <baseline>');
  console.error('Example: node scripts/bump-deploy-meta.mjs D-151A 1028/24/57');
  process.exit(1);
}

if (!baseline) {
  console.error('Error: baseline string is required.');
  console.error('Usage: node scripts/bump-deploy-meta.mjs <checkpoint> <baseline>');
  console.error('Example: node scripts/bump-deploy-meta.mjs D-151A 1028/24/57');
  process.exit(1);
}

// Baseline must match NNN/NN/NN pattern (three slash-separated integers).
if (!/^\d+\/\d+\/\d+$/.test(baseline)) {
  console.error(`Error: baseline "${baseline}" does not match the expected format NNN/NN/NN.`);
  console.error('Example valid baseline: 1028/24/57');
  process.exit(1);
}

// Checkpoint must be a non-empty string with no whitespace.
if (/\s/.test(checkpoint)) {
  console.error(`Error: checkpoint "${checkpoint}" must not contain whitespace.`);
  process.exit(1);
}

// ── Read git short SHA ────────────────────────────────────────────────────────

let commit;
try {
  commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {
  console.error('Error: could not read git HEAD. Is this a git repository?');
  process.exit(1);
}

if (!commit || !/^[0-9a-f]{7,}$/.test(commit)) {
  console.error(`Error: unexpected git short SHA format: "${commit}"`);
  process.exit(1);
}

// ── Write deploy-meta.js ──────────────────────────────────────────────────────

const updatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

const content = `// D-150A: Static deployment provenance. Update on every commit to main.
// No secrets, no tokens, no user data, no D1 access.
export const DEPLOY_META = {
  app:        'humanx',
  checkpoint: '${checkpoint}',
  commit:     '${commit}',
  baseline:   '${baseline}',
  updated_at: '${updatedAt}',
};
`;

const outPath = path.join(__dirname, '../src/deploy-meta.js');
writeFileSync(outPath, content, 'utf8');

// ── Print confirmation and next steps ─────────────────────────────────────────

console.log('');
console.log('deploy-meta.js updated:');
console.log(`  checkpoint: ${checkpoint}`);
console.log(`  commit:     ${commit}`);
console.log(`  baseline:   ${baseline}`);
console.log(`  updated_at: ${updatedAt}`);
console.log('');
console.log('Next steps:');
console.log('  1. node scripts/hardening-smoke-test.mjs');
console.log('  2. node scripts/belief-engine-static-check.mjs');
console.log('  3. node scripts/worker-route-static-check.mjs');
console.log('  4. git add src/deploy-meta.js && git commit -m "chore: bump deploy-meta for <checkpoint>"');
console.log('  5. npx wrangler deploy');
console.log('  6. Verify: GET https://humanx.rinkimirikata.com/api/version');
console.log('');
