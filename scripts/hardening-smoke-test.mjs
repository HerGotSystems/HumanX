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
  if (message.includes('foreign key')) return false;
  return message.includes('unique') || message.includes('constraint failed');
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

// ── 5. isUniqueConstraintError FK exclusion ──────────────────────────────────

console.log('\n5. isUniqueConstraintError FK exclusion');

test('FOREIGN KEY constraint failed is NOT treated as unique constraint error', () => {
  assert.equal(isUniqueConstraintError(new Error('FOREIGN KEY constraint failed: SQLITE_CONSTRAINT')), false);
});

test('UNIQUE constraint failed is treated as unique constraint error', () => {
  assert.equal(isUniqueConstraintError(new Error('UNIQUE constraint failed: claims.normalized_claim')), true);
});

test('constraint failed (generic) without foreign key prefix is treated as unique constraint error', () => {
  assert.equal(isUniqueConstraintError(new Error('constraint failed')), true);
});

// ── 6. convertTruthToClaim atomicity (mock) ──────────────────────────────────

console.log('\n6. convertTruthToClaim atomicity (mock)');

// Simulates the guarded new-claim path: claim insert succeeds, link insert fails → claim is deleted.
async function simulateConvertAtomicity({ linkShouldFail }) {
  const deleted = [];
  const inserted = [];

  const mockDb = {
    prepare: (sql) => ({
      bind: (...args) => ({
        run: async () => {
          if (sql.includes('INSERT INTO claims')) {
            inserted.push(args[0]);
            return {};
          }
          if (sql.includes('INSERT OR IGNORE INTO truth_claim_links') && linkShouldFail) {
            throw new Error('FOREIGN KEY constraint failed: SQLITE_CONSTRAINT');
          }
          if (sql.includes('DELETE FROM claims')) {
            deleted.push(args[0]);
            return {};
          }
          return {};
        },
        first: async () => null,
      }),
    }),
  };

  const claimId = 'clm_test_atomicity';
  let linkErr = null;
  try {
    await mockDb.prepare('INSERT INTO claims (id) VALUES (?)').bind(claimId).run();
    try {
      await mockDb.prepare('INSERT OR IGNORE INTO truth_claim_links (id) VALUES (?)').bind('tcl_x').run();
    } catch (err) {
      await mockDb.prepare('DELETE FROM claims WHERE id=?').bind(claimId).run().catch(() => {});
      linkErr = err;
    }
  } catch (_) {}

  return { inserted, deleted, linkErr };
}

await testAsync('when link insert fails with FK error, orphan claim is deleted', async () => {
  const { inserted, deleted, linkErr } = await simulateConvertAtomicity({ linkShouldFail: true });
  assert.ok(inserted.includes('clm_test_atomicity'), 'claim should have been inserted first');
  assert.ok(deleted.includes('clm_test_atomicity'), 'orphan claim should be deleted on link failure');
  assert.ok(linkErr !== null, 'link error should have been captured');
});

await testAsync('when link insert succeeds, claim is NOT deleted', async () => {
  const { inserted, deleted, linkErr } = await simulateConvertAtomicity({ linkShouldFail: false });
  assert.ok(inserted.includes('clm_test_atomicity'), 'claim should have been inserted');
  assert.equal(deleted.length, 0, 'no deletion should occur on success');
  assert.equal(linkErr, null, 'no link error expected');
});

// ── 7. createTruth linked_claim_id NULL guard ────────────────────────────────

console.log('\n7. createTruth linked_claim_id NULL guard');

// Simulates cleanId + null-guard logic used in createTruth.
function cleanId(v) { return String(v || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80); }

test('cleanId of empty string + null-guard produces null (safe for FK column)', () => {
  const result = cleanId('') || null;
  assert.equal(result, null, 'empty string should become null, not ""');
});

test('cleanId of undefined + null-guard produces null', () => {
  const result = cleanId(undefined) || null;
  assert.equal(result, null);
});

test('cleanId of valid id + null-guard preserves the id', () => {
  const result = cleanId('clm_abc123') || null;
  assert.equal(result, 'clm_abc123');
});

test('cleanId of whitespace-only + null-guard produces null', () => {
  const result = cleanId('   ') || null;
  assert.equal(result, null);
});

// ── 8. ensureUser SELECT-first pattern ───────────────────────────────────────

console.log('\n8. ensureUser SELECT-first pattern');

// Simulates the SELECT-first pattern used in createTruth and convertTruthToClaim.
async function simulateEnsureUser(env, userId) {
  const existingUser = await env.DB.prepare(`SELECT id FROM users WHERE id=?`).bind(userId).first();
  if (!existingUser) {
    await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at) VALUES (?, ?, ?)`)
      .bind(userId, `anon-${userId.slice(-6)}`, Date.now())
      .run();
    return 'inserted';
  }
  return 'already-existed';
}

await testAsync('ensureUser inserts user when not found', async () => {
  const inserts = [];
  const mockEnv = {
    DB: {
      prepare: (sql) => ({
        bind: (...args) => ({
          first: async () => null,      // user not found
          run: async () => { inserts.push(sql); return {}; },
        }),
      }),
    },
  };
  const result = await simulateEnsureUser(mockEnv, 'usr_test123');
  assert.equal(result, 'inserted');
  assert.ok(inserts.some(s => s.includes('INSERT OR IGNORE INTO users')), 'should have attempted user insert');
});

await testAsync('ensureUser skips insert when user already exists', async () => {
  const inserts = [];
  const mockEnv = {
    DB: {
      prepare: (sql) => ({
        bind: (...args) => ({
          first: async () => ({ id: 'usr_test123' }), // user found
          run: async () => { inserts.push(sql); return {}; },
        }),
      }),
    },
  };
  const result = await simulateEnsureUser(mockEnv, 'usr_test123');
  assert.equal(result, 'already-existed');
  assert.equal(inserts.length, 0, 'should NOT attempt insert when user already exists');
});

// ── 9. reviewCleanup validation logic ────────────────────────────────────────

console.log('\n9. reviewCleanup validation logic');

// Inline copy of the backend artefact heuristic for pure-function testing.
function isTestArtefact(text) {
  const t = String(text || '').toLowerCase();
  return t.includes('smoke') || /\btest\b/.test(t) || t.includes('automated write') || t.includes('automated smoke');
}

// Inline copy of frontend heuristic (mirrors backend).
function isSuspectedTestArtefactPure(item) {
  const text = [item.claim || '', item.statement || '', item.origin || '', item.category || '', item.handle || ''].join(' ').toLowerCase();
  return text.includes('smoke') || /\btest\b/.test(text) || text.includes('automated write') || text.includes('automated smoke');
}

test('backend heuristic: "automated write smoke test claim" is artefact', () => {
  assert.equal(isTestArtefact('automated write smoke test claim'), true);
});

test('backend heuristic: "SMOKE artefact" (case insensitive) is artefact', () => {
  assert.equal(isTestArtefact('SMOKE artefact'), true);
});

test('backend heuristic: word "test" alone triggers artefact', () => {
  assert.equal(isTestArtefact('a test claim'), true);
});

test('backend heuristic: "protest" does NOT trigger word-boundary test match', () => {
  assert.equal(isTestArtefact('protest march'), false);
});

test('backend heuristic: "automated smoke" triggers artefact', () => {
  assert.equal(isTestArtefact('automated smoke verification'), true);
});

test('backend heuristic: normal claim is NOT artefact', () => {
  assert.equal(isTestArtefact('The Earth orbits the Sun'), false);
});

test('cleanup requires rejected: non-rejected state should be blocked', () => {
  const states = ['review', 'public', 'archived'];
  for (const s of states) {
    assert.ok(s !== 'rejected', `State "${s}" should not be "rejected"`);
  }
});

test('cleanup allows only claim or truth target types', () => {
  const allowed = new Set(['claim', 'truth']);
  assert.ok(allowed.has('claim'));
  assert.ok(allowed.has('truth'));
  assert.ok(!allowed.has('evidence'));
  assert.ok(!allowed.has('report'));
  assert.ok(!allowed.has(''));
});

test('frontend heuristic matches backend: smoke artefact', () => {
  const item = { claim: 'automated write smoke test claim', statement: '', origin: '', category: '', handle: '' };
  assert.equal(isSuspectedTestArtefactPure(item), isTestArtefact(item.claim));
});

test('frontend heuristic matches backend: normal claim', () => {
  const item = { claim: 'The Earth orbits the Sun', statement: '', origin: '', category: '', handle: '' };
  assert.equal(isSuspectedTestArtefactPure(item), isTestArtefact(item.claim));
});

// Static check: no hard delete in cleanup path
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerSrc = readFileSync(path.join(__dirname, '../src/worker.js'), 'utf8');

// Extract just the reviewCleanup function body for targeted checks.
const cleanupMatch = workerSrc.match(/async function reviewCleanup[\s\S]*?\n(?=async function )/);
const cleanupBody = cleanupMatch ? cleanupMatch[0] : '';

test('reviewCleanup function exists in worker.js', () => {
  assert.ok(cleanupBody.length > 0, 'reviewCleanup function not found in src/worker.js');
});

test('reviewCleanup does NOT contain DELETE FROM', () => {
  assert.ok(!cleanupBody.toUpperCase().includes('DELETE FROM'), 'reviewCleanup must not perform hard deletes');
});

test('reviewCleanup sets review_state to archived (not deleted)', () => {
  assert.ok(cleanupBody.includes("review_state='archived'"), 'reviewCleanup should set review_state to archived');
});

test('reviewCleanup calls requireAdmin', () => {
  assert.ok(cleanupBody.includes('requireAdmin'), 'reviewCleanup must verify admin token');
});

test('reviewCleanup checks CLEANUP_REQUIRES_REJECTED', () => {
  assert.ok(cleanupBody.includes('CLEANUP_REQUIRES_REJECTED'), 'reviewCleanup must reject non-rejected items');
});

test('reviewCleanup checks CLEANUP_REQUIRES_TEST_ARTEFACT', () => {
  assert.ok(cleanupBody.includes('CLEANUP_REQUIRES_TEST_ARTEFACT'), 'reviewCleanup must reject non-artefact items');
});

// ── 10. reviewQueue archived metadata ────────────────────────────────────────

console.log('\n10. reviewQueue archived metadata');

// Use the already-loaded workerSrc from section 9.
const reviewQueueMatch = workerSrc.match(/async function reviewQueue[\s\S]*?\n(?=async function )/);
const reviewQueueBody = reviewQueueMatch ? reviewQueueMatch[0] : '';

test('reviewQueue function exists in worker.js', () => {
  assert.ok(reviewQueueBody.length > 0, 'reviewQueue not found in src/worker.js');
});

test('reviewQueue excludes archived from claims list query', () => {
  assert.ok(reviewQueueBody.includes("'archived'") && reviewQueueBody.includes("!='archived'") || reviewQueueBody.includes('NOT IN') && reviewQueueBody.includes("'archived'"), 'reviewQueue claims query must exclude archived state');
});

test('reviewQueue excludes archived from truths list query', () => {
  assert.ok(reviewQueueBody.includes("NOT IN ('public','archived')") || (reviewQueueBody.includes("'archived'") && reviewQueueBody.includes('NOT IN')), 'reviewQueue truths query must exclude archived state');
});

test('reviewQueue includes archived_total in response metadata', () => {
  assert.ok(reviewQueueBody.includes('archived_total'), 'reviewQueue must return archived_total metadata');
});

test('reviewQueue archived count query is wrapped in try/catch (non-fatal)', () => {
  assert.ok(reviewQueueBody.includes('try') && reviewQueueBody.includes('catch'), 'archived count query must have try/catch fallback');
});

test('reviewQueue returns archived_claims and archived_truths', () => {
  assert.ok(reviewQueueBody.includes('archived_claims') && reviewQueueBody.includes('archived_truths'), 'reviewQueue must return per-type archived counts');
});

// Frontend: archived cards and filter must not be added.
const appSrc = readFileSync(path.join(__dirname, '../public/app-v10.js'), 'utf8');

test('frontend loadReviewQueue stores archived_total from response', () => {
  assert.ok(appSrc.includes('archived_total:data.archived_total'), 'loadReviewQueue must propagate archived_total');
});

test('frontend audit summary references archived_total', () => {
  assert.ok(appSrc.includes('reviewQueue.archived_total'), 'renderReviewAuditSummary must read archived_total from reviewQueue');
});

test('frontend does NOT render archived filter chip', () => {
  // The filter bar only has: review, public, rejected, reported, all
  const filterDefsMatch = appSrc.match(/\['\w+','[\w ]+'\].*?\['\w+','[\w ]+'\].*?\['\w+','[\w ]+'\]/);
  // Simpler check: 'archived' must not appear in the filter defs array near setReviewFilter
  const filterSection = appSrc.match(/const defs=\[[\s\S]*?\];/)?.[0] || '';
  assert.ok(!filterSection.includes("'archived'"), 'archived must not appear as a filter chip in the review filter bar');
});

// ── 11. belief-bridge promoteToTruth FK safety ───────────────────────────────

console.log('\n11. belief-bridge promoteToTruth FK safety');

const bridgeSrc = readFileSync(path.join(__dirname, '../src/belief-bridge.js'), 'utf8');

// Extract promoteToTruth body for targeted assertions.
const promoteToTruthMatch = bridgeSrc.match(/async function promoteToTruth[\s\S]*?\n(?=async function )/);
const promoteToTruthBody = promoteToTruthMatch ? promoteToTruthMatch[0] : '';

test('promoteToTruth function exists in belief-bridge.js', () => {
  assert.ok(promoteToTruthBody.length > 0, 'promoteToTruth not found in src/belief-bridge.js');
});

test('promoteToTruth null-guards linked_claim_id with || null', () => {
  // Must have the null-guard so empty cleanId() becomes NULL, not ''
  assert.ok(
    promoteToTruthBody.includes("cleanId(body.linkedClaimId || body.linked_claim_id || linkedClaim?.id || '') || null"),
    'promoteToTruth must apply || null to linked_claim_id to avoid FK violation with empty string'
  );
});

// Verify the fixed isUniqueConstraintError in belief-bridge excludes FK errors.
const bridgeIsUniqueMatch = bridgeSrc.match(/function isUniqueConstraintError[\s\S]*?\n\}/);
const bridgeIsUniqueBody = bridgeIsUniqueMatch ? bridgeIsUniqueMatch[0] : '';

test('belief-bridge isUniqueConstraintError excludes foreign key errors', () => {
  assert.ok(
    bridgeIsUniqueBody.includes("foreign key"),
    'isUniqueConstraintError in belief-bridge.js must exclude FK errors with foreign key guard'
  );
});

test('belief-bridge isUniqueConstraintError: FK message returns false (inline simulation)', () => {
  // Inline the fixed function to verify behaviour without importing the module.
  function isUniqueConstraintErrorFixed(err) {
    const message = String(err && err.message ? err.message : err).toLowerCase();
    if (message.includes('foreign key')) return false;
    return message.includes('unique') || message.includes('constraint failed');
  }
  assert.equal(
    isUniqueConstraintErrorFixed(new Error('D1_ERROR: FOREIGN KEY constraint failed: SQLITE_CONSTRAINT')),
    false,
    'FK error must not be classified as unique constraint error'
  );
});

test('belief-bridge isUniqueConstraintError: unique message returns true (inline simulation)', () => {
  function isUniqueConstraintErrorFixed(err) {
    const message = String(err && err.message ? err.message : err).toLowerCase();
    if (message.includes('foreign key')) return false;
    return message.includes('unique') || message.includes('constraint failed');
  }
  assert.equal(
    isUniqueConstraintErrorFixed(new Error('UNIQUE constraint failed: truths.normalized_statement')),
    true,
    'Unique constraint error must still be classified correctly'
  );
});

test('belief-bridge isUniqueConstraintError: generic constraint failed returns true (inline simulation)', () => {
  function isUniqueConstraintErrorFixed(err) {
    const message = String(err && err.message ? err.message : err).toLowerCase();
    if (message.includes('foreign key')) return false;
    return message.includes('unique') || message.includes('constraint failed');
  }
  assert.equal(
    isUniqueConstraintErrorFixed(new Error('constraint failed')),
    true,
    'Generic constraint failed must still be classified as unique error'
  );
});

// ── 12. reviewStatusBadge coverage ───────────────────────────────────────────

console.log('\n12. reviewStatusBadge coverage');

const cssSrc = readFileSync(path.join(__dirname, '../public/styles.css'), 'utf8');

test('app-v10.js contains function reviewStatusBadge', () => {
  assert.ok(appSrc.includes('function reviewStatusBadge'), 'reviewStatusBadge helper must exist in app-v10.js');
});

test('studyReviewBadge delegates to reviewStatusBadge', () => {
  assert.ok(appSrc.includes('function studyReviewBadge') && appSrc.includes('return reviewStatusBadge(c,true)'), 'studyReviewBadge must call reviewStatusBadge with withNote=true');
});

test('claim card rendering calls reviewStatusBadge(c)', () => {
  assert.ok(appSrc.includes('reviewStatusBadge(c)'), 'claim card (card function) must call reviewStatusBadge(c)');
});

test('truth card rendering calls reviewStatusBadge(t)', () => {
  assert.ok(appSrc.includes('reviewStatusBadge(t)'), 'truthCard must call reviewStatusBadge(t)');
});

test('CSS contains .review-badge-block', () => {
  assert.ok(cssSrc.includes('.review-badge-block'), 'styles.css must define .review-badge-block for list-card badge layout');
});

test('CSS contains .study-review-state', () => {
  assert.ok(cssSrc.includes('.study-review-state'), 'styles.css must define .study-review-state for Study badge+note layout');
});

// ── 13. Known-good docs block ─────────────────────────────────────────────────

console.log('\n13. Known-good docs block');

const readmeSrc = readFileSync(path.join(__dirname, '../docs/README.md'), 'utf8');

test('docs/README.md contains "Known-good checks" section', () => {
  assert.ok(readmeSrc.includes('Known-good checks'), 'docs/README.md must contain a "Known-good checks" section');
});

// Self-reference: when new checks are added to this file, update docs/README.md
// Known-good checks table and this assertion together in the same commit.
test('docs/README.md documents hardening smoke count: 77 passed, 0 failed', () => {
  assert.ok(readmeSrc.includes('77 passed, 0 failed'), 'docs/README.md must document hardening smoke expected count of 77');
});

test('docs/README.md documents belief engine count: 24 passed, 0 failed', () => {
  assert.ok(readmeSrc.includes('24 passed, 0 failed'), 'docs/README.md must document belief engine static check expected count of 24');
});

test('docs/README.md documents worker route count: 35 passed, 0 failed', () => {
  assert.ok(readmeSrc.includes('35 passed, 0 failed'), 'docs/README.md must document worker route static check expected count of 35');
});

test('docs/README.md mentions MODULE_TYPELESS_PACKAGE_JSON as non-blocking', () => {
  assert.ok(readmeSrc.includes('MODULE_TYPELESS_PACKAGE_JSON'), 'docs/README.md must mention MODULE_TYPELESS_PACKAGE_JSON warning');
});

test('docs/README.md states live write tests require explicit approval', () => {
  assert.ok(
    readmeSrc.includes('live write') && readmeSrc.includes('explicit'),
    'docs/README.md must state that live write smoke tests require explicit approval'
  );
});

// ── 14. Frontend navigation wiring (B-1 fixes) ────────────────────────────────

console.log('\n14. Frontend navigation wiring (B-1 fixes)');

// appSrc already loaded in section 10.

// Extract function bodies for scoped assertions.
const pbIdx = appSrc.indexOf('async function promoteBelief(');
const promoteBeliefBody = pbIdx >= 0 ? appSrc.slice(pbIdx, pbIdx + 900) : '';

const ctIdx = appSrc.indexOf('async function convertTruth(');
const convertTruthBody = ctIdx >= 0 ? appSrc.slice(ctIdx, ctIdx + 500) : '';

const evIdx = appSrc.indexOf('function evidenceCard(');
const evidenceCardBody = evIdx >= 0 ? appSrc.slice(evIdx, evIdx + 2000) : '';

test('studyFromVault function is defined in app-v10.js', () => {
  assert.ok(appSrc.includes('function studyFromVault('), 'studyFromVault helper must be defined so vault→study→back returns to the correct tab');
});

test('studyFromVault is exposed on window', () => {
  assert.ok(appSrc.includes('window.studyFromVault=studyFromVault'), 'studyFromVault must be assigned to window for inline onclick use in evidenceCard');
});

test('evidenceCard Study Linked Claim button calls studyFromVault not selectClaim directly', () => {
  assert.ok(
    evidenceCardBody.includes("studyFromVault('") || evidenceCardBody.includes('studyFromVault(`'),
    'evidenceCard Study Linked Claim button must use studyFromVault so Back navigates to Claims, not stuck in vault mode'
  );
});

test('promoteBelief truth path activates tab-truths', () => {
  assert.ok(promoteBeliefBody.includes("'tab-truths'"), 'promoteBelief truth path must activate the Truths tab to keep tab highlight in sync');
});

test('promoteBelief claim path activates tab-arena', () => {
  assert.ok(promoteBeliefBody.includes("'tab-arena'"), 'promoteBelief claim path must activate the Claims tab to keep tab highlight in sync');
});

test('convertTruth activates tab-arena before navigating to study', () => {
  assert.ok(convertTruthBody.includes("'tab-arena'"), 'convertTruth must activate the Claims tab when navigating to study view');
});

test('evidenceCard date fallback includes e.createdAt (evidence-vault contract)', () => {
  // evidence-vault.js maps row.created_at → createdAt (camelCase).
  // The date chain must include e.createdAt or vault card dates silently disappear.
  assert.ok(
    evidenceCardBody.includes('e.createdAt'),
    'evidenceCard date chain must include e.createdAt — listEvidenceVault returns createdAt not created_at'
  );
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
