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
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
let sealed = false;

function windowsRun(command) {
  const comspec = process.env.ComSpec || 'cmd.exe';
  return spawnSync(comspec, ['/d', '/s', '/c', command], { encoding: 'utf8' });
}

function outputFor(run) {
  const launchError = run?.error ? `${run.error.name}: ${run.error.message}` : '';
  return `${run?.stdout || ''}\n${run?.stderr || ''}${launchError ? `\n${launchError}` : ''}`;
}

function mutation(sql, { expectFailure = false, marker = '' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'humanx-untested-smoke-'));
  const file = join(dir, 'statement.sql');
  writeFileSync(file, `${sql.trim()}\n`, 'utf8');

  let run;
  try {
    if (process.platform === 'win32') {
      run = windowsRun(`npx wrangler d1 execute ${database} --remote --yes --file="${file}"`);
    } else {
      run = spawnSync('npx', ['wrangler', 'd1', 'execute', database, '--remote', '--yes', '--file', file], { encoding: 'utf8' });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  const output = outputFor(run);
  if (expectFailure) {
    if (run?.status === 0) throw new Error(`Expected failure but command succeeded:\n${sql}`);
    if (marker && !output.includes(marker)) throw new Error(`Expected ${marker}, got:\n${output}`);
  } else if (run?.status !== 0) {
    throw new Error(`Command failed (${run?.status}):\n${sql}\n${output}`);
  }
  return output;
}

function query(sql) {
  let run;
  if (process.platform === 'win32') {
    const escaped = sql.replaceAll('"', '""');
    run = windowsRun(`npx wrangler d1 execute ${database} --remote --yes --json --command="${escaped}"`);
  } else {
    run = spawnSync('npx', ['wrangler', 'd1', 'execute', database, '--remote', '--yes', '--json', '--command', sql], { encoding: 'utf8' });
  }

  const output = outputFor(run);
  if (run?.status !== 0) throw new Error(`Query failed (${run?.status}):\n${sql}\n${output}`);

  const clean = String(run.stdout || '').replace(/\x1B\[[0-?]*[ -\/]*[@-~]/g, '').trim();
  const start = clean.indexOf('[');
  const end = clean.lastIndexOf(']');
  if (start < 0 || end < start) throw new Error(`Could not parse Wrangler JSON output:\n${output}`);

  let payload;
  try {
    payload = JSON.parse(clean.slice(start, end + 1));
  } catch (error) {
    throw new Error(`Invalid Wrangler JSON output: ${error.message}\n${output}`);
  }
  return payload.flatMap(item => Array.isArray(item?.results) ? item.results : []);
}

function check(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

function cleanupSessions() {
  mutation(`DELETE FROM untested_sessions WHERE session_id IN ('${session}','${session}-early');`);
}

function cleanupDraftVersion(draftVersion) {
  mutation(`DELETE FROM untested_sessions WHERE instrument_version='${draftVersion}';`);
  mutation(`DELETE FROM untested_choice_definitions WHERE instrument_version='${draftVersion}';`);
  mutation(`DELETE FROM untested_variant_definitions WHERE instrument_version='${draftVersion}';`);
  mutation(`DELETE FROM untested_scenario_definitions WHERE instrument_version='${draftVersion}';`);
  mutation(`DELETE FROM untested_confidence_definitions WHERE instrument_version='${draftVersion}';`);
  mutation(`DELETE FROM untested_instrument_copy WHERE instrument_version='${draftVersion}';`);
  mutation(`DELETE FROM untested_instrument_versions WHERE instrument_version='${draftVersion}' AND sealed_at IS NULL;`);
}

function cleanupDraft() {
  cleanupDraftVersion(version);
}

function cleanupAbandonedDrafts() {
  const rows = query("SELECT instrument_version FROM untested_instrument_versions WHERE instrument_version GLOB 'untested-smoke-*' AND sealed_at IS NULL ORDER BY instrument_version;");
  for (const row of rows) cleanupDraftVersion(row.instrument_version);
  if (rows.length) console.log(`Cleaned ${rows.length} abandoned unsealed smoke draft(s).`);
}

console.log(`Remote D1: ${database}`);
console.log(`Permanent sealed smoke version: ${version}`);

try {
  cleanupAbandonedDrafts();

  check('create draft version', () => mutation(
    `INSERT INTO untested_instrument_versions (instrument_version,created_at) VALUES ('${version}',${Date.now()});`
  ));

  check('unsealed session rejected', () => mutation(
    `INSERT INTO untested_sessions (session_id,instrument_version,created_at) VALUES ('${session}-early','${version}',${Date.now()});`,
    { expectFailure: true, marker: 'UNTESTED_VERSION_NOT_SEALED' }
  ));

  check('definition insert increments revision', () => {
    mutation(`INSERT INTO untested_instrument_copy VALUES ('${version}','open','close','confidence','results');`);
    const row = query(`SELECT draft_revision FROM untested_instrument_versions WHERE instrument_version='${version}';`)[0];
    if (Number(row?.draft_revision) !== 1) throw new Error(`Expected draft_revision=1, got ${JSON.stringify(row)}`);
  });

  check('stale revision cannot seal', () => {
    mutation(`UPDATE untested_instrument_copy SET opening_text='open-2' WHERE instrument_version='${version}';`);
    mutation(`UPDATE untested_instrument_versions SET content_hash='${'a'.repeat(64)}',sealed_at=${Date.now()} WHERE instrument_version='${version}' AND sealed_at IS NULL AND draft_revision=1;`);
    const row = query(`SELECT sealed_at,draft_revision FROM untested_instrument_versions WHERE instrument_version='${version}';`)[0];
    if (Number(row?.draft_revision) !== 2 || row?.sealed_at !== null) throw new Error(`Stale seal was not rejected: ${JSON.stringify(row)}`);
  });

  check('matching revision seals', () => {
    const expectedHash = 'b'.repeat(64);
    mutation(`UPDATE untested_instrument_versions SET content_hash='${expectedHash}',sealed_at=${Date.now()} WHERE instrument_version='${version}' AND sealed_at IS NULL AND draft_revision=2;`);
    const row = query(`SELECT content_hash,sealed_at FROM untested_instrument_versions WHERE instrument_version='${version}';`)[0];
    if (row?.content_hash !== expectedHash || row?.sealed_at === null || row?.sealed_at === undefined) throw new Error(`Matching seal failed: ${JSON.stringify(row)}`);
    sealed = true;
  });

  check('session accepted after seal', () => mutation(
    `INSERT INTO untested_sessions (session_id,instrument_version,created_at) VALUES ('${session}','${version}',${Date.now()});`
  ));

  check('sealed insert rejected', () => mutation(
    `INSERT INTO untested_confidence_definitions VALUES ('${version}',0,'No',0);`,
    { expectFailure: true, marker: 'UNTESTED_VERSION_SEALED' }
  ));
  check('sealed update rejected', () => mutation(
    `UPDATE untested_instrument_copy SET opening_text='mutated' WHERE instrument_version='${version}';`,
    { expectFailure: true, marker: 'UNTESTED_VERSION_SEALED' }
  ));
  check('sealed delete rejected', () => mutation(
    `DELETE FROM untested_instrument_copy WHERE instrument_version='${version}';`,
    { expectFailure: true, marker: 'UNTESTED_VERSION_SEALED' }
  ));
  check('sealed version mutation rejected', () => mutation(
    `UPDATE untested_instrument_versions SET content_hash='${'c'.repeat(64)}' WHERE instrument_version='${version}';`,
    { expectFailure: true, marker: 'UNTESTED_VERSION_IMMUTABLE' }
  ));

  cleanupSessions();
  console.log(`\n${passed} passed, 0 failed`);
  console.log(`Sealed smoke version retained intentionally: ${version}`);
} catch (error) {
  try {
    if (sealed) cleanupSessions();
    else cleanupDraft();
    console.error(sealed
      ? `Cleaned smoke sessions; sealed version retained: ${version}`
      : `Cleaned interrupted unsealed smoke draft: ${version}`);
  } catch (cleanupError) {
    console.error(`Cleanup failed for ${version}: ${cleanupError.message}`);
  }
  throw error;
}
