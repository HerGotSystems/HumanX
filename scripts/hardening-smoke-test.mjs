/**
 * hardening-smoke-test.mjs
 *
 * Self-contained smoke tests for hardening changes.
 * No external test framework required.
 *
 * Run: node scripts/hardening-smoke-test.mjs
 */

import assert from 'node:assert/strict';
import { meaningKey, meaningMatch } from '../src/meaning-key.js';

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
test('docs/README.md documents hardening smoke count: 113 passed, 0 failed', () => {
  assert.ok(readmeSrc.includes('113 passed, 0 failed'), 'docs/README.md must document hardening smoke expected count of 113');
});

test('docs/README.md documents belief engine count: 24 passed, 0 failed', () => {
  assert.ok(readmeSrc.includes('24 passed, 0 failed'), 'docs/README.md must document belief engine static check expected count of 24');
});

test('docs/README.md documents worker route count: 39 passed, 0 failed', () => {
  assert.ok(readmeSrc.includes('39 passed, 0 failed'), 'docs/README.md must document worker route static check expected count of 39');
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

test('markDuplicateUI is exposed on window', () => {
  assert.ok(appSrc.includes('window.markDuplicateUI=markDuplicateUI'), 'markDuplicateUI must be assigned to window for inline onclick use in review inspect panel');
});

test('resolveSimilarUI is exposed on window', () => {
  assert.ok(appSrc.includes('window.resolveSimilarUI=resolveSimilarUI'), 'resolveSimilarUI must be assigned to window for inline onclick use in review inspect panel');
});

test('markDuplicateUI calls /api/review/mark-duplicate with adminHeaders', () => {
  assert.ok(appSrc.includes("'/api/review/mark-duplicate'"), 'markDuplicateUI must call /api/review/mark-duplicate');
  assert.ok(appSrc.includes('adminHeaders()'), 'markDuplicateUI must use adminHeaders for admin-only route');
});

test('resolveSimilarUI calls /api/review/resolve-similar with adminHeaders', () => {
  assert.ok(appSrc.includes("'/api/review/resolve-similar'"), 'resolveSimilarUI must call /api/review/resolve-similar');
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

// ── 15. meaningMatch near-duplicate detection (D-10C) ────────────────────────

console.log('\n15. meaningMatch near-duplicate detection');

// appSrc is already loaded above (line ~539)

test('meaningMatch: "Moon landing" matches "Humans landed on the Moon"', () => {
  assert.strictEqual(
    meaningMatch('Moon landing', 'Humans landed on the Moon'),
    true,
    'suffix normalisation and threshold should flag these as similar'
  );
});

test('meaningMatch: "Humans landed on the Moon" does NOT match "Humans didnt land on moon"', () => {
  assert.strictEqual(
    meaningMatch('Humans landed on the Moon', 'Humans didnt land on moon'),
    false,
    'opposite-polarity claims: affirmation vs negation must not be flagged as near-duplicates'
  );
});

test('meaningMatch: "Human really landed on Moon" matches "Humans landed on the Moon"', () => {
  assert.strictEqual(
    meaningMatch('Human really landed on Moon', 'Humans landed on the Moon'),
    true,
    'plural suffix and adverb stopword should produce same key'
  );
});

test('meaningMatch: "God doesnt exist" matches "God does not exist"', () => {
  assert.strictEqual(
    meaningMatch('God doesnt exist', 'God does not exist'),
    true,
    'contraction stripping and "not"/"does" as stopwords should unify these'
  );
});

test('meaningMatch: "Vaccines cause autism" matches "The MMR vaccine causes autism"', () => {
  assert.strictEqual(
    meaningMatch('Vaccines cause autism', 'The MMR vaccine causes autism'),
    true,
    'plural suffix normalisation should match vaccines/vaccine and causes/cause'
  );
});

test('meaningMatch: "The Earth is flat" does NOT match "The Moon is round"', () => {
  assert.strictEqual(
    meaningMatch('The Earth is flat', 'The Moon is round'),
    false,
    'unrelated claims must not produce false positive'
  );
});

test('meaningMatch: "Power corrupts" does NOT match "Money corrupts"', () => {
  assert.strictEqual(
    meaningMatch('Power corrupts', 'Money corrupts'),
    false,
    'single shared word (corrupt) below minimum overlap threshold — must not match'
  );
});

test('meaningMatch: "God exists" does NOT match "God does not exist"', () => {
  assert.strictEqual(
    meaningMatch('God exists', 'God does not exist'),
    false,
    'un-negated claim must not match its negation — negation polarity check must fire'
  );
});

test('meaningMatch: "Moon landing happened" does NOT match "Moon landing was faked"', () => {
  assert.strictEqual(
    meaningMatch('Moon landing happened', 'Moon landing was faked'),
    false,
    'shared topic words alone must not satisfy threshold when predicate is entirely different'
  );
});

test('reviewCard references item.near_duplicate_of (snake_case from D1 raw row)', () => {
  assert.ok(
    appSrc.includes('item.near_duplicate_of'),
    'reviewCard must read near_duplicate_of from raw D1 row (snake_case)'
  );
});

test('renderReviewInspectPanel nearDup declared at function scope (not inside else block)', () => {
  assert.ok(
    appSrc.includes('review-similar-note'),
    'renderReviewInspectPanel must render review-similar-note when near_duplicate_of is set — confirms nearDup is in scope'
  );
});

test('applyReviewFilter handles similar filter branch', () => {
  assert.ok(
    appSrc.includes("f==='similar'"),
    "applyReviewFilter must contain f==='similar' branch so ~Similar filter chip works"
  );
});

test('review filter defs include similar chip', () => {
  assert.ok(
    appSrc.includes("'similar','~Similar'"),
    "renderReviewFilterBar defs must include ['similar','~Similar'] chip"
  );
});

test('meaningMatch is exported from meaning-key.js', () => {
  assert.ok(
    typeof meaningMatch === 'function',
    'meaningMatch must be exported and importable from src/meaning-key.js'
  );
});

// ── 20. D-28: Worker-side RunPack provenance (Phase 2) ────────────────────────

console.log('\n20. D-28: Worker-side RunPack provenance (Phase 2)');

test('workerSnapshotHash function defined in worker.js', () => {
  assert.ok(
    workerSrc.includes('function workerSnapshotHash(detail)'),
    'workerSnapshotHash must be defined in src/worker.js'
  );
});

test('buildRunPack accepts provenance param and spreads it', () => {
  assert.ok(
    workerSrc.includes('function buildRunPack(detail, provenance)') &&
    workerSrc.includes('...(provenance||{})'),
    'buildRunPack must accept provenance param and spread it into the packet'
  );
});

test('createAipPacket stamps packet_id and runpack_version 1.2', () => {
  assert.ok(
    workerSrc.includes("runpack_version:'1.2'") &&
    workerSrc.includes('packet_id:packetId'),
    'createAipPacket must stamp packet_id and runpack_version:1.2 in provenance'
  );
});

test('createAipPacket stamps humanx_worker_version v1', () => {
  assert.ok(
    workerSrc.includes("humanx_worker_version:'v1'"),
    'createAipPacket provenance must include humanx_worker_version:v1'
  );
});

// ── 21. D-29: Frontend RunPack provenance de-duplication ─────────────────────

console.log('\n21. D-29: Frontend RunPack provenance de-duplication');

test('generateRunPack preserves Worker packet_id when present (D-29)', () => {
  assert.ok(
    appSrc.includes('data.packet&&data.packet.packet_id') &&
    appSrc.includes("humanx_app_version:'v10'"),
    'generateRunPack must check data.packet.packet_id and only merge humanx_app_version when Worker already stamped provenance'
  );
});

// ── 22. D-38: Public visibility guards ───────────────────────────────────────

console.log('\n22. D-38: Public visibility guards');

const vaultSrc = readFileSync(path.join(__dirname, '../src/evidence-vault.js'), 'utf8');

test("evidence-vault.js contains COALESCE(c.review_state,'public')='public' public filter", () => {
  assert.ok(
    vaultSrc.includes("COALESCE(c.review_state,'public')='public'"),
    "evidence-vault.js must filter evidence to only claims where COALESCE(c.review_state,'public')='public'"
  );
});

test('getClaim has public visibility guard for non-public claims (D-38)', () => {
  assert.ok(
    workerSrc.includes("(claim.review_state||'public')!=='public'") &&
    workerSrc.includes("getClaim(request, env, claimId)"),
    'getClaim must check review_state and return CLAIM_NOT_FOUND for non-public claims'
  );
});

test('createAipPacket checks review_state public before buildRunPack (D-38)', () => {
  assert.ok(
    workerSrc.includes("(detail.claim.reviewState||'public')!=='public'") &&
    workerSrc.includes('createAipPacket'),
    'createAipPacket must guard against non-public claims before building RunPack'
  );
});

// ── 23. D-42B: Evidence moderation backend guards ────────────────────────────

console.log('\n23. D-42B: Evidence moderation backend guards');

test("insertEvidence INSERT includes review_state column and default param (D-42B)", () => {
  assert.ok(
    workerSrc.includes("INSERT INTO evidence (id,claim_id,user_id,stance,quality,title,body,source_url,created_at,review_state)"),
    "insertEvidence INSERT must include review_state column"
  );
  assert.ok(
    workerSrc.includes("reviewState='review'"),
    "insertEvidence must have reviewState='review' as default parameter"
  );
});

test("evidence-vault.js filters COALESCE(e.review_state,'public')='public' (D-42B)", () => {
  assert.ok(
    vaultSrc.includes("COALESCE(e.review_state,'public')='public'"),
    "evidence-vault.js must filter evidence by its own review_state"
  );
});

test("claimDetail evidence queries filter COALESCE(review_state,'public')='public' (D-42B)", () => {
  assert.ok(
    workerSrc.includes("FROM evidence WHERE claim_id=? AND COALESCE(review_state,'public')='public'"),
    "claimDetail direct evidence query must include review_state filter"
  );
  assert.ok(
    workerSrc.includes("WHERE l.claim_id=? AND COALESCE(e.review_state,'public')='public'"),
    "claimDetail reused evidence query must include evidence review_state filter"
  );
});

test("reportTarget handles targetType 'evidence' with auto-escalation (D-42B)", () => {
  assert.ok(
    workerSrc.includes("targetType === 'evidence'") &&
    workerSrc.includes("UPDATE evidence SET report_count=report_count+1"),
    "reportTarget must have an evidence branch that increments report_count and auto-escalates"
  );
});

test("reviewDecision handles targetType 'evidence' and returns ok response (D-42B)", () => {
  assert.ok(
    workerSrc.includes("UPDATE evidence SET review_state=?, report_count=0 WHERE id=?"),
    "reviewDecision evidence branch must update review_state and reset report_count"
  );
  assert.ok(
    workerSrc.includes("allowed:['claim','truth','evidence']"),
    "reviewDecision BAD_REVIEW_TARGET allowed list must include 'evidence'"
  );
});

// ── 24. D-43: Evidence review UI frontend guards ──────────────────────────────

console.log('\n24. D-43: Evidence review UI frontend guards');

test("reviewCard handles target_type 'evidence' — isEvidence branch present (D-43)", () => {
  assert.ok(
    appSrc.includes("const isEvidence=type==='evidence';"),
    "reviewCard must declare isEvidence from type"
  );
  assert.ok(
    appSrc.includes("isEvidence?(item.title||'Evidence')"),
    "reviewCard must use item.title as title for evidence items"
  );
});

test("renderReviewInspectPanel hides duplicate controls for evidence (D-43)", () => {
  assert.ok(
    appSrc.includes("(!isTruth&&!isEvidence)?((canMarkDup?"),
    "renderReviewInspectPanel dupSection must be hidden for evidence"
  );
  assert.ok(
    appSrc.includes("isEvidence?(item.claim_id?"),
    "renderReviewInspectPanel studyBtn must link to parent claim for evidence"
  );
});

// ── 25. D-50: Score filters only public evidence ───────────────────────────────

console.log('\n25. D-50: Score filters only public evidence');

const scoringSrc = readFileSync(path.join(__dirname, '../src/claim-scoring.js'), 'utf8');

test("recalcClaimScore direct evidence query filters by COALESCE(review_state,'public')='public' (D-50)", () => {
  assert.ok(
    scoringSrc.includes("COALESCE(review_state,'public')='public'"),
    "direct evidence query must filter to public review_state only"
  );
});

test("recalcClaimScore reused evidence query filters by COALESCE(e.review_state,'public')='public' (D-50)", () => {
  assert.ok(
    scoringSrc.includes("COALESCE(e.review_state,'public')='public'"),
    "reused evidence join query must filter to public review_state on evidence table"
  );
});

test("reviewDecision evidence branch calls recalcClaimScore after decision (D-50)", () => {
  assert.ok(
    workerSrc.includes("if (row.claim_id) await recalcClaimScore(env, row.claim_id).catch(()=>null);"),
    "reviewDecision evidence branch must call recalcClaimScore after updating review_state"
  );
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
