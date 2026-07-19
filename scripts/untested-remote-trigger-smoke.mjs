#!/usr/bin/env node
/**
 * Remote D1 smoke probe for UNTESTED triggers.
 *
 * IMPORTANT: this performs real remote D1 writes and deliberately leaves one
 * sealed smoke instrument-version row behind because sealed versions are
 * immutable by design. It never applies migrations and never deploys code.
 *
 * Required invocation:
 *   node scripts/untested-remote-trigger-smoke.mjs \
 *     --database humanx --confirm-live-write LEAVE_SEALED_SMOKE_VERSION
 */
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const valueAfter = flag => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : '';
};
const database = valueAfter('--database');
const confirmation = valueAfter('--confirm-live-write');

if (!database || confirmation !== 'LEAVE_SEALED_SMOKE_VERSION') {
  console.error('Refusing remote writes. Required: --database <name> --confirm-live-write LEAVE_SEALED_SMOKE_VERSION');
  process.exit(2);
}

const version = `untested-smoke-${Date.now()}`;
const session = `unt-smoke-${Date.now()}`;
let passed = 0;

function wrangler(sql, { expectFailure = false, marker = '' } = {}) {
  const run = spawnSync(
    'npx',
    ['wrangler', 'd1', 'execute', database, '--remote', '--command', sql],
    { encoding: 'utf8', shell: process.platform === 'win32' }
  );
  const launchError = run.error ? `${run.error.name}: ${run.error.message}` : '';
  const output = `${run.stdout || ''}\n${run.stderr || ''}${launchError ? `\n${launchError}` : ''}`;
  if (expectFailure) {
    if (run.status === 0) throw new Error(`Expected failure but command succeeded:\n${sql}`);
    if (marker && !output.includes(marker)) throw new Error(`Expected ${marker}, got:\n${output}`);
  } else if (run.status !== 0) {
    throw new Error(`Command failed (${run.status}):\n${sql}\n${output}`);
  }
  return output;
}

function check(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

console.log(`Remote D1: ${database}`);
console.log(`Permanent sealed smoke version: ${version}`);

check('create draft version', () => wrangler(
  `INSERT INTO untested_instrument_versions (instrument_version,created_at) VALUES ('${version}',${Date.now()});`
));

check('unsealed session rejected', () => wrangler(
  `INSERT INTO untested_sessions (session_id,instrument_version,created_at) VALUES ('${session}-early','${version}',${Date.now()});`,
  { expectFailure: true, marker: 'UNTESTED_VERSION_NOT_SEALED' }
));

check('definition insert increments revision', () => {
  wrangler(`INSERT INTO untested_instrument_copy VALUES ('${version}','open','close','confidence','results');`);
  const output = wrangler(`SELECT draft_revision FROM untested_instrument_versions WHERE instrument_version='${version}';`);
  if (!/draft_revision[\s\S]*1/.test(output)) throw new Error(`Expected draft_revision=1, got:\n${output}`);
});

check('stale revision cannot seal', () => {
  wrangler(`UPDATE untested_instrument_copy SET opening_text='open-2' WHERE instrument_version='${version}';`);
  wrangler(`UPDATE untested_instrument_versions SET content_hash='${'a'.repeat(64)}',sealed_at=${Date.now()} WHERE instrument_version='${version}' AND sealed_at IS NULL AND draft_revision=1;`);
  const output = wrangler(`SELECT sealed_at,draft_revision FROM untested_instrument_versions WHERE instrument_version='${version}';`);
  if (!/draft_revision[\s\S]*2/.test(output) || !/sealed_at[\s\S]*null/i.test(output)) throw new Error(`Stale seal was not rejected:\n${output}`);
});

check('matching revision seals', () => wrangler(
  `UPDATE untested_instrument_versions SET content_hash='${'b'.repeat(64)}',sealed_at=${Date.now()} WHERE instrument_version='${version}' AND sealed_at IS NULL AND draft_revision=2;`
));

check('session accepted after seal', () => wrangler(
  `INSERT INTO untested_sessions (session_id,instrument_version,created_at) VALUES ('${session}','${version}',${Date.now()});`
));

check('sealed insert rejected', () => wrangler(
  `INSERT INTO untested_confidence_definitions VALUES ('${version}',0,'No',0);`,
  { expectFailure: true, marker: 'UNTESTED_VERSION_SEALED' }
));
check('sealed update rejected', () => wrangler(
  `UPDATE untested_instrument_copy SET opening_text='mutated' WHERE instrument_version='${version}';`,
  { expectFailure: true, marker: 'UNTESTED_VERSION_SEALED' }
));
check('sealed delete rejected', () => wrangler(
  `DELETE FROM untested_instrument_copy WHERE instrument_version='${version}';`,
  { expectFailure: true, marker: 'UNTESTED_VERSION_SEALED' }
));
check('sealed version mutation rejected', () => wrangler(
  `UPDATE untested_instrument_versions SET content_hash='${'c'.repeat(64)}' WHERE instrument_version='${version}';`,
  { expectFailure: true, marker: 'UNTESTED_VERSION_IMMUTABLE' }
));

wrangler(`DELETE FROM untested_sessions WHERE session_id='${session}';`);
console.log(`\n${passed} passed, 0 failed`);
console.log(`Sealed smoke version retained intentionally: ${version}`);
