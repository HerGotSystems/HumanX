#!/usr/bin/env node
/**
 * scripts/live-preflight.mjs
 *
 * Public-safe production preflight check. No auth, no secrets, no deploy.
 *
 * Usage:
 *   node scripts/live-preflight.mjs <baseUrl> <checkpoint> <commit> <baseline> [--json]
 *
 * Example:
 *   node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-151A f77390b 1042/24/57
 *
 * Exits 0 if all checks pass, 1 on any mismatch or fetch failure.
 */

const [baseUrl, checkpoint, commit, baseline] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const jsonMode = process.argv.includes('--json');

// ── Validate args ─────────────────────────────────────────────────────────────

if (!baseUrl || !checkpoint || !commit || !baseline) {
  console.error('Usage: node scripts/live-preflight.mjs <baseUrl> <checkpoint> <commit> <baseline> [--json]');
  console.error('Example: node scripts/live-preflight.mjs https://humanx.rinkimirikata.com D-151A f77390b 1042/24/57');
  process.exit(1);
}

if (!/^https?:\/\//.test(baseUrl)) {
  console.error(`Error: baseUrl must start with http:// or https:// — got: ${baseUrl}`);
  process.exit(1);
}

if (!/^\d+\/\d+\/\d+$/.test(baseline)) {
  console.error(`Error: baseline "${baseline}" does not match the expected format NNN/NN/NN.`);
  process.exit(1);
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchJson(url) {
  const res = await fetch(url);
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

// ── Run checks ────────────────────────────────────────────────────────────────

const results = [];
let allPassed = true;

function check(name, passed, got, expected) {
  const result = { name, passed, got: String(got), expected: String(expected) };
  results.push(result);
  if (!passed) allPassed = false;
  return result;
}

let versionBody = null;
let healthBody  = null;

try {
  const versionUrl = `${baseUrl}/api/version`;
  const healthUrl  = `${baseUrl}/api/health`;

  const [vRes, hRes] = await Promise.all([fetchJson(versionUrl), fetchJson(healthUrl)]);

  versionBody = vRes.body;
  healthBody  = hRes.body;

  check('/api/version HTTP status',   vRes.status === 200,                  vRes.status,              200);
  check('/api/version ok === true',   versionBody?.ok === true,             versionBody?.ok,          true);
  check('/api/version app === humanx',versionBody?.app === 'humanx',        versionBody?.app,         'humanx');
  check('checkpoint matches',         versionBody?.checkpoint === checkpoint, versionBody?.checkpoint, checkpoint);
  check('commit matches',             versionBody?.commit === commit,         versionBody?.commit,      commit);
  check('baseline matches',           versionBody?.baseline === baseline,     versionBody?.baseline,    baseline);
  check('/api/health HTTP status',    hRes.status === 200,                  hRes.status,              200);
  check('/api/health ok === true',    healthBody?.ok === true,              healthBody?.ok,           true);

} catch (err) {
  results.push({ name: 'fetch', passed: false, got: err.message, expected: 'no error' });
  allPassed = false;
}

// ── Output ────────────────────────────────────────────────────────────────────

if (jsonMode) {
  console.log(JSON.stringify({ passed: allPassed, checks: results }, null, 2));
} else {
  console.log('');
  console.log(`HumanX Live Preflight — ${baseUrl}`);
  console.log('─'.repeat(52));
  for (const r of results) {
    const icon = r.passed ? 'PASS' : 'FAIL';
    console.log(`  ${icon}: ${r.name}`);
    if (!r.passed) {
      console.log(`        expected: ${r.expected}`);
      console.log(`        got:      ${r.got}`);
    }
  }
  console.log('');
  if (allPassed) {
    console.log(`  ✓ All checks passed. Production is running ${checkpoint} / ${commit}.`);
  } else {
    console.log('  ✗ One or more checks failed. Do not start live verification.');
  }
  console.log('');
}

if (!allPassed) process.exit(1);
