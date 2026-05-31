/**
 * backfill-normalized-content.mjs
 *
 * Backfills normalized_statement (truths) and normalized_claim (claims)
 * for rows where those columns are NULL or empty.
 *
 * Usage:
 *   CLOUDFLARE_ACCOUNT_ID=xxx CLOUDFLARE_API_TOKEN=xxx D1_DATABASE_ID=xxx \
 *     node scripts/backfill-normalized-content.mjs
 *
 * Dry-run mode (default): prints what it would update, makes no changes.
 * Apply mode: pass --apply flag to write updates to D1.
 *
 *   node scripts/backfill-normalized-content.mjs --apply
 *
 * Required environment variables:
 *   CLOUDFLARE_ACCOUNT_ID  — Your Cloudflare account ID
 *   CLOUDFLARE_API_TOKEN   — API token with D1:Edit permission
 *   D1_DATABASE_ID         — The D1 database UUID (not the binding name)
 */

import { meaningKey } from '../src/meaning-key.js';

const APPLY = process.argv.includes('--apply');
const PAGE_SIZE = 500;

// ── Startup checks ──────────────────────────────────────────────────────────

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DATABASE_ID = process.env.D1_DATABASE_ID;

const missing = [];
if (!ACCOUNT_ID) missing.push('CLOUDFLARE_ACCOUNT_ID');
if (!API_TOKEN)  missing.push('CLOUDFLARE_API_TOKEN');
if (!DATABASE_ID) missing.push('D1_DATABASE_ID');

if (missing.length > 0) {
  console.error('ERROR: Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

console.log('=== HumanX normalized content backfill ===');
console.log(`Mode: ${APPLY ? 'APPLY (will write to D1)' : 'DRY RUN (no changes)'}`);
console.log(`Account: ${ACCOUNT_ID}`);
console.log(`Database: ${DATABASE_ID}`);
console.log('');

// ── D1 REST API helper ───────────────────────────────────────────────────────

const D1_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;

async function d1Query(sql, params = []) {
  const res = await fetch(D1_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    const errMsg = (data.errors || []).map(e => e.message).join('; ') || res.statusText;
    throw new Error(`D1 query failed: ${errMsg}\nSQL: ${sql}`);
  }

  return data.result?.[0] || { results: [] };
}

// ── Pagination helper ────────────────────────────────────────────────────────

async function* fetchAllPages(sql, countSql) {
  const countResult = await d1Query(countSql);
  const total = countResult.results?.[0]?.n ?? 0;
  console.log(`  Total rows needing backfill: ${total}`);
  if (total === 0) return;

  let offset = 0;
  while (offset < total) {
    const result = await d1Query(`${sql} LIMIT ${PAGE_SIZE} OFFSET ${offset}`);
    const rows = result.results || [];
    if (rows.length === 0) break;
    yield* rows;
    offset += rows.length;
  }
}

// ── Truths backfill ──────────────────────────────────────────────────────────

console.log('--- Truths: normalized_statement ---');
let truthsUpdated = 0;
let truthsSkipped = 0;

const truthsSql = `SELECT id, statement FROM truths WHERE normalized_statement IS NULL OR normalized_statement = ''`;
const truthsCountSql = `SELECT COUNT(*) AS n FROM truths WHERE normalized_statement IS NULL OR normalized_statement = ''`;

for await (const row of fetchAllPages(truthsSql, truthsCountSql)) {
  const normalized = meaningKey(row.statement || '');
  if (!normalized) {
    console.log(`  SKIP truth ${row.id}: normalized key is empty (statement: ${JSON.stringify(row.statement)})`);
    truthsSkipped++;
    continue;
  }

  if (APPLY) {
    try {
      await d1Query(
        `UPDATE truths SET normalized_statement=? WHERE id=? AND (normalized_statement IS NULL OR normalized_statement='')`,
        [normalized, row.id]
      );
      console.log(`  UPDATED truth ${row.id}: "${normalized}"`);
    } catch (err) {
      if (err.message.includes('UNIQUE') || err.message.includes('constraint')) {
        console.warn(`  CONFLICT truth ${row.id}: normalized key "${normalized}" already exists in another row — skipping`);
        truthsSkipped++;
        continue;
      }
      throw err;
    }
  } else {
    console.log(`  DRY RUN truth ${row.id}: would set normalized_statement="${normalized}"`);
  }
  truthsUpdated++;
}

console.log(`Truths: ${truthsUpdated} ${APPLY ? 'updated' : 'would update'}, ${truthsSkipped} skipped`);
console.log('');

// ── Claims backfill ──────────────────────────────────────────────────────────

console.log('--- Claims: normalized_claim ---');
let claimsUpdated = 0;
let claimsSkipped = 0;

const claimsSql = `SELECT id, claim FROM claims WHERE normalized_claim IS NULL OR normalized_claim = ''`;
const claimsCountSql = `SELECT COUNT(*) AS n FROM claims WHERE normalized_claim IS NULL OR normalized_claim = ''`;

for await (const row of fetchAllPages(claimsSql, claimsCountSql)) {
  const normalized = meaningKey(row.claim || '');
  if (!normalized) {
    console.log(`  SKIP claim ${row.id}: normalized key is empty (claim: ${JSON.stringify(row.claim)})`);
    claimsSkipped++;
    continue;
  }

  if (APPLY) {
    try {
      await d1Query(
        `UPDATE claims SET normalized_claim=? WHERE id=? AND (normalized_claim IS NULL OR normalized_claim='')`,
        [normalized, row.id]
      );
      console.log(`  UPDATED claim ${row.id}: "${normalized}"`);
    } catch (err) {
      if (err.message.includes('UNIQUE') || err.message.includes('constraint')) {
        console.warn(`  CONFLICT claim ${row.id}: normalized key "${normalized}" already exists in another row — skipping`);
        claimsSkipped++;
        continue;
      }
      throw err;
    }
  } else {
    console.log(`  DRY RUN claim ${row.id}: would set normalized_claim="${normalized}"`);
  }
  claimsUpdated++;
}

console.log(`Claims: ${claimsUpdated} ${APPLY ? 'updated' : 'would update'}, ${claimsSkipped} skipped`);
console.log('');

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('=== Done ===');
if (!APPLY) {
  console.log('Re-run with --apply to write changes to D1.');
}
