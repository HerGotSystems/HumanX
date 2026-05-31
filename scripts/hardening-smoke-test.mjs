/**
 * hardening-smoke-test.mjs
 *
 * Self-contained smoke tests for hardening changes.
 * No external test framework required.
 *
 * Run: node scripts/hardening-smoke-test.mjs
 */

import assert from 'node:assert/strict';
import { meaningKey } from '../src/meaning-key.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(`        ${err.message}`);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(`        ${err.message}`);
    failed++;
  }
}

// ── 1. isUniqueConstraintError ───────────────────────────────────────────────

// Inline copy for testing — does not import from src to avoid Worker globals.
function isUniqueConstraintError(err) {
  const message = String(err && err.message ? err.message : err).toLowerCase();
  return message.includes('unique') || message.includes('constraint') || message.includes('constraint failed');
}

console.log('\n1. isUniqueConstraintError');

test('matches UNIQUE constraint failed: truths.normalized_statement', () => {
  assert.equal(isUniqueConstraintError(new Error('UNIQUE constraint failed: truths.normalized_statement')), true);
});

test('matches constraint failed', () => {
  assert.equal(isUniqueConstraintError(new Error('constraint failed')), true);
});

test('matches unique violation (case insensitive)', () => {
  assert.equal(isUniqueConstraintError(new Error('unique violation')), true);
});

test('does NOT match some other error', () => {
  assert.equal(isUniqueConstraintError(new Error('some other error')), false);
});

test('does NOT match network timeout', () => {
  assert.equal(isUniqueConstraintError(new Error('network timeout')), false);
});

// ── 2. meaningKey stable output ──────────────────────────────────────────────

console.log('\n2. meaningKey stable output');

test('"Hello World" and "hello  world" produce same key', () => {
  assert.equal(meaningKey('Hello World'), meaningKey('hello  world'));
});

test('"  HELLO WORLD  " matches "hello world"', () => {
  assert.equal(meaningKey('  HELLO WORLD  '), meaningKey('hello world'));
});

test('empty string returns empty string or consistent value (no throw)', () => {
  const result = meaningKey('');
  assert.equal(typeof result, 'string');
});

test('null handled without throwing', () => {
  let result;
  assert.doesNotThrow(() => { result = meaningKey(null); });
  assert.equal(typeof result, 'string');
});

test('undefined handled without throwing', () => {
  let result;
  assert.doesNotThrow(() => { result = meaningKey(undefined); });
  assert.equal(typeof result, 'string');
});

test('normalizes accented chars', () => {
  // é -> e after NFD decomposition
  const k1 = meaningKey('cafe');
  const k2 = meaningKey('café');
  assert.equal(k1, k2);
});

// ── 3. Mock INSERT OR IGNORE id fix ─────────────────────────────────────────

console.log('\n3. Mock INSERT OR IGNORE id fix');

// Simulate the logic in attachEvidenceToClaim after the fix.
async function simulateAttachEvidenceToClaim(db, evidenceId, claimId, generatedId) {
  // INSERT OR IGNORE (mock — no actual insert)
  await db.insertOrIgnore(evidenceId, claimId, generatedId);

  // After fix: always fetch the actual row
  const linkRow = await db.prepare(`SELECT id FROM evidence_claim_links WHERE evidence_id=? AND claim_id=? LIMIT 1`)
    .bind(evidenceId, claimId)
    .first();
  const actualLinkId = linkRow?.id || generatedId;
  return actualLinkId;
}

await testAsync('returns actual id when insert was ignored (existing row)', async () => {
  const EXISTING_ID = 'ecl_existing_000000000000000000';
  const GENERATED_ID = 'ecl_generated_000000000000000000';

  // Mock DB simulating an existing row (insert ignored)
  const mockDb = {
    insertOrIgnore: async () => { /* row already exists, insert ignored */ },
    prepare: (sql) => ({
      bind: (evidenceId, claimId) => ({
        first: async () => ({ id: EXISTING_ID }) // returns existing row
      })
    })
  };

  const result = await simulateAttachEvidenceToClaim(mockDb, 'ev1', 'clm1', GENERATED_ID);
  assert.equal(result, EXISTING_ID, `Expected existing id ${EXISTING_ID}, got ${result}`);
});

await testAsync('returns generated id when insert succeeded (new row)', async () => {
  const GENERATED_ID = 'ecl_generated_000000000000000000';

  // Mock DB simulating new row inserted
  const mockDb = {
    insertOrIgnore: async () => { /* new row inserted */ },
    prepare: (sql) => ({
      bind: (evidenceId, claimId) => ({
        first: async () => ({ id: GENERATED_ID }) // same as generated
      })
    })
  };

  const result = await simulateAttachEvidenceToClaim(mockDb, 'ev1', 'clm1', GENERATED_ID);
  assert.equal(result, GENERATED_ID);
});

await testAsync('falls back to generated id if SELECT returns nothing (defensive)', async () => {
  const GENERATED_ID = 'ecl_generated_000000000000000000';

  const mockDb = {
    insertOrIgnore: async () => {},
    prepare: (sql) => ({
      bind: () => ({
        first: async () => null // no row found
      })
    })
  };

  const result = await simulateAttachEvidenceToClaim(mockDb, 'ev1', 'clm1', GENERATED_ID);
  assert.equal(result, GENERATED_ID);
});

// ── 4. safeRateLimit RATE_LIMIT_UNAVAILABLE ──────────────────────────────────

console.log('\n4. safeRateLimit RATE_LIMIT_UNAVAILABLE');

// Inline copy for testing.
async function safeRateLimit(request, env, rateKey, maxHits, windowMs) {
  try {
    const now = Date.now();
    const row = await env.DB.prepare(`SELECT hits, window_start FROM rate_limits WHERE "key"=?`).bind(rateKey).first();
    if (!row || now - row.window_start > windowMs) {
      await env.DB.prepare(`INSERT OR REPLACE INTO rate_limits ("key",hits,window_start) VALUES (?,?,?)`).bind(rateKey, 1, now).run();
      return;
    }
    if (row.hits >= maxHits) throw new Error('RATE_LIMITED');
    await env.DB.prepare(`UPDATE rate_limits SET hits=hits+1 WHERE "key"=?`).bind(rateKey).run();
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    if (message.includes('RATE_LIMITED')) throw err;
    throw new Error(`RATE_LIMIT_UNAVAILABLE: ${message}`);
  }
}

await testAsync('throws RATE_LIMIT_UNAVAILABLE when DB SELECT throws', async () => {
  const brokenEnv = {
    DB: {
      prepare: () => ({
        bind: () => ({
          first: async () => { throw new Error('D1 connection refused'); },
          run: async () => {}
        })
      })
    }
  };

  const fakeRequest = { headers: { get: () => null } };

  try {
    await safeRateLimit(fakeRequest, brokenEnv, 'test:key', 10, 3600000);
    assert.fail('Expected RATE_LIMIT_UNAVAILABLE to be thrown');
  } catch (err) {
    assert.ok(
      String(err.message).includes('RATE_LIMIT_UNAVAILABLE'),
      `Expected RATE_LIMIT_UNAVAILABLE, got: ${err.message}`
    );
  }
});

await testAsync('throws RATE_LIMITED (not RATE_LIMIT_UNAVAILABLE) when limit exceeded', async () => {
  const limitedEnv = {
    DB: {
      prepare: () => ({
        bind: () => ({
          first: async () => ({ hits: 10, window_start: Date.now() - 100 }),
          run: async () => {}
        })
      })
    }
  };

  const fakeRequest = { headers: { get: () => null } };

  try {
    await safeRateLimit(fakeRequest, limitedEnv, 'test:key', 10, 3600000);
    assert.fail('Expected RATE_LIMITED to be thrown');
  } catch (err) {
    assert.ok(
      String(err.message).includes('RATE_LIMITED'),
      `Expected RATE_LIMITED, got: ${err.message}`
    );
    assert.ok(
      !String(err.message).includes('RATE_LIMIT_UNAVAILABLE'),
      `Should not be RATE_LIMIT_UNAVAILABLE, got: ${err.message}`
    );
  }
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
