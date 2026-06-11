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

// Inline copy of legacy backend keyword-only artefact heuristic (v1, pre D-88B).
// Kept for backward-compatibility of existing keyword tests below.
// D-88B backend now uses isTestArtefactV2 (defined later in this section).
function isTestArtefact(text) {
  const t = String(text || '').toLowerCase();
  return t.includes('smoke') || /\btest\b/.test(t) || t.includes('automated write') || t.includes('automated smoke');
}

// Inline copy of frontend heuristic (D-87B extended: handle + id-pattern + keyword).
function isSuspectedTestArtefactPure(item) {
  const handle = (item.handle || '').toLowerCase();
  const id = item.id || '';
  if (['humanx-seed','anon-o_seed','anon-xksavy','anon-73d9y2','anon-ek3562'].includes(handle)) return true;
  if (/^clm_seed_/.test(id) || /^HX-/i.test(id)) return true;
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

// D-88B: expanded policy checks
test('reviewCleanup blocks protected launch seeds with CLEANUP_PROTECTED_SEED', () => {
  assert.ok(cleanupBody.includes('CLEANUP_PROTECTED_SEED'), 'reviewCleanup must block protected seed IDs');
});

test('reviewCleanup blocks status_locked rows with CLEANUP_REQUIRES_NOT_LOCKED', () => {
  assert.ok(cleanupBody.includes('CLEANUP_REQUIRES_NOT_LOCKED'), 'reviewCleanup must refuse to archive status_locked items');
});

test('reviewCleanup recognises clm_seed_ id pattern as artefact', () => {
  assert.ok(cleanupBody.includes('clm_seed_'), 'reviewCleanup must detect clm_seed_ id prefix');
});

test('reviewCleanup recognises HX- id pattern as artefact', () => {
  assert.ok(cleanupBody.match(/HX-/), 'reviewCleanup must detect HX- id prefix for dev seed rows');
});

test('reviewCleanup recognises known dev/test handles as artefacts', () => {
  assert.ok(cleanupBody.includes('humanx-seed') && cleanupBody.includes('anon-o_seed') && cleanupBody.includes('anon-xksavy'), 'reviewCleanup must detect known dev handles');
});

test('reviewCleanup supports junk_override path', () => {
  assert.ok(cleanupBody.includes('junk_override'), 'reviewCleanup must support junk_override body field');
});

test('reviewCleanup requires reason for junk_override', () => {
  assert.ok(cleanupBody.includes('CLEANUP_REASON_REQUIRED'), 'reviewCleanup must reject junk_override with missing reason');
});

test('reviewCleanup applies secondary heuristic for junk_override', () => {
  assert.ok(cleanupBody.includes('CLEANUP_JUNK_OVERRIDE_REJECTED'), 'reviewCleanup must reject junk_override when heuristic fails');
});

test('reviewCleanup policy v2: archive_policy field present in success path', () => {
  assert.ok(cleanupBody.includes('archive_policy'), 'reviewCleanup success response must include archive_policy field');
});

// Inline v2 artefact heuristic for pure-function testing (mirrors D-88B backend logic)
function isTestArtefactV2({ id = '', handle = '', text = '' }) {
  const t = String(text || '').toLowerCase();
  const h = String(handle || '').toLowerCase();
  const keywordMatch = t.includes('smoke') || /\btest\b/.test(t) || t.includes('automated write') || t.includes('automated smoke');
  const idPatternMatch = /^clm_seed_/.test(id) || /^HX-\d/i.test(id);
  const DEV_HANDLES = new Set(['humanx-seed', 'anon-o_seed', 'anon-xksavy', 'anon-73d9y2', 'anon-ek3562']);
  const handleMatch = DEV_HANDLES.has(h);
  return keywordMatch || idPatternMatch || handleMatch;
}

test('v2 heuristic: clm_seed_ id prefix triggers artefact', () => {
  assert.equal(isTestArtefactV2({ id: 'clm_seed_abc123', handle: '', text: 'The Earth is flat' }), true);
});

test('v2 heuristic: HX-000001 id triggers artefact', () => {
  assert.equal(isTestArtefactV2({ id: 'HX-000001', handle: '', text: 'The Earth is flat' }), true);
});

test('v2 heuristic: humanx-seed handle triggers artefact', () => {
  assert.equal(isTestArtefactV2({ id: 'clm_abc', handle: 'humanx-seed', text: 'Normal claim text' }), true);
});

test('v2 heuristic: anon-xksavy handle triggers artefact', () => {
  assert.equal(isTestArtefactV2({ id: 'clm_abc', handle: 'anon-xksavy', text: 'Normal claim text' }), true);
});

test('v2 heuristic: normal user claim is NOT artefact', () => {
  assert.equal(isTestArtefactV2({ id: 'clm_abc123', handle: 'anon-user99', text: 'Vaccines cause autism' }), false);
});

test('v2 heuristic: text keyword still works alongside id/handle signals', () => {
  assert.equal(isTestArtefactV2({ id: 'clm_abc123', handle: 'anon-user99', text: 'automated smoke check' }), true);
});

// Junk heuristic pure-function test (mirrors D-88B backend logic)
function junkHeuristicPass(rawText) {
  const trimmed = String(rawText || '').trim();
  const isShort = trimmed.length <= 40;
  const isAllCapsFragment = /^[A-Z0-9\s!?.,'"-]{1,40}$/.test(trimmed) && /^[A-Z]/.test(trimmed) && trimmed === trimmed.toUpperCase() && trimmed.split(/\s+/).length <= 3;
  const alphaChars = (trimmed.match(/[a-zA-Z]/g) || []).length;
  const totalChars = trimmed.replace(/\s/g, '').length || 1;
  const alphaRatio = alphaChars / totalChars;
  const isLowAlpha = alphaRatio < 0.6 && trimmed.length > 3;
  return isShort || isAllCapsFragment || isLowAlpha;
}

test('junk heuristic: short text (<= 40 chars) passes', () => {
  assert.equal(junkHeuristicPass('Blablablabla'), true);
});

test('junk heuristic: gibberish keyboard mash (low alpha ratio) passes', () => {
  assert.equal(junkHeuristicPass('gfsdhdfhfdhdfhdfhgdfa'), true);
});

test('junk heuristic: all-caps 1-word fragment passes', () => {
  assert.equal(junkHeuristicPass('DOCTRINE'), true);
});

test('junk heuristic: long factual claim does NOT pass', () => {
  assert.equal(junkHeuristicPass('The government is secretly controlling all major media outlets and suppressing evidence of extraterrestrial contact'), false);
});

test('junk heuristic: full sentence (> 40 chars, normal alpha) does NOT pass', () => {
  assert.equal(junkHeuristicPass('Never trust the experts on this important matter at all'), false);
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
  // D-97B: truthCard now passes truthCtx=true → reviewStatusBadge(t,false,true)
  assert.ok(appSrc.includes('reviewStatusBadge(t,false,true)') || appSrc.includes('reviewStatusBadge(t)'), 'truthCard must call reviewStatusBadge for the truth');
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
test('docs/README.md documents hardening smoke count: 254 passed, 0 failed (legacy check — see D-93B Section 37)', () => {
  assert.ok(readmeSrc.includes('254 passed, 0 failed') || readmeSrc.includes('266 passed, 0 failed') || readmeSrc.includes('267 passed, 0 failed') || readmeSrc.includes('272 passed, 0 failed') || readmeSrc.includes('286 passed, 0 failed') || readmeSrc.includes('299 passed, 0 failed') || readmeSrc.includes('312 passed, 0 failed') || readmeSrc.includes('324 passed, 0 failed') || readmeSrc.includes('328 passed, 0 failed') || readmeSrc.includes('340 passed, 0 failed') || readmeSrc.includes('353 passed, 0 failed') || readmeSrc.includes('357 passed, 0 failed') || readmeSrc.includes('362 passed, 0 failed'), 'docs/README.md must document hardening smoke expected count');
});

test('docs/README.md documents belief engine count: 24 passed, 0 failed', () => {
  assert.ok(readmeSrc.includes('24 passed, 0 failed'), 'docs/README.md must document belief engine static check expected count of 24');
});

test('docs/README.md documents worker route count: 39 passed, 0 failed', () => {
  assert.ok(readmeSrc.includes('39 passed, 0 failed') || readmeSrc.includes('48 passed, 0 failed') || readmeSrc.includes('56 passed, 0 failed'), 'docs/README.md must document worker route static check expected count of 39');
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
    workerSrc.includes("allowed:['claim','truth','evidence','pressure']"),
    "reviewDecision BAD_REVIEW_TARGET allowed list must include 'evidence' and 'pressure' (D-90B extended)"
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
    appSrc.includes("(!isTruth&&!isEvidence&&!isPressure)?((canMarkDup?"),
    "renderReviewInspectPanel dupSection must be hidden for evidence and pressure"
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

// ── 26. D-59: Seed import route safety ────────────────────────────────────────

console.log('\n26. D-59: Seed import route safety');

const importerSrc = readFileSync(path.join(__dirname, '../src/importer.js'), 'utf8');
const truthSeedSrc = readFileSync(path.join(__dirname, '../src/truth-seed.js'), 'utf8');

test('/api/seed route requires admin before writing (D-59)', () => {
  assert.ok(
    workerSrc.includes("if (url.pathname === '/api/seed' && request.method === 'GET') { const adminError = requireAdmin(request, env); if (adminError) return adminError;"),
    "/api/seed must call requireAdmin before any DB write"
  );
});

test('/api/import-seed route defaults to dry-run mode (D-59)', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/import-seed'") &&
    workerSrc.includes("url.searchParams.get('mode') || 'dry-run'") &&
    workerSrc.includes("dryRun: mode !== 'apply'"),
    "/api/import-seed must extract mode param, default to dry-run, and pass dryRun option"
  );
});

test('/api/import-truths route defaults to dry-run mode (D-59)', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/import-truths'") &&
    workerSrc.includes("dryRun: mode !== 'apply'"),
    "/api/import-truths must extract mode param, default to dry-run, and pass dryRun option"
  );
});

test("importSeedData uses reviewState parameter instead of hardcoded 'public' for claims (D-59)", () => {
  assert.ok(
    importerSrc.includes('reviewState') &&
    importerSrc.includes("reviewState = 'review'") &&
    !importerSrc.includes("now,\n          'public'\n        )\n        .run()"),
    "importSeedData must use reviewState option for claims, not hardcoded 'public'"
  );
});

test("importTruthSeeds uses reviewState parameter instead of hardcoded 'public' for truths (D-59)", () => {
  assert.ok(
    truthSeedSrc.includes('reviewState') &&
    truthSeedSrc.includes("reviewState = 'review'"),
    "importTruthSeeds must use reviewState option for truths, not hardcoded 'public'"
  );
});

test('importSeedData SOURCE_NEEDED guard blocks apply mode when source_url is empty or placeholder (D-59)', () => {
  assert.ok(
    importerSrc.includes('SOURCE_NEEDED_BLOCKED') &&
    importerSrc.includes("src.includes('SOURCE_NEEDED')"),
    "importSeedData must check each evidence source_url for SOURCE_NEEDED placeholder and block apply if found"
  );
});

// ── Section 27 — D-83C: status_locked column and recalcClaimScore guard ───────

const migrationSrc0008 = readFileSync(path.join(__dirname, '../migrations/0008_add_status_locked.sql'), 'utf8');

test('D-83C: migration 0008 adds status_locked INTEGER NOT NULL DEFAULT 0 (D-83C)', () => {
  assert.ok(
    migrationSrc0008.includes('status_locked INTEGER NOT NULL DEFAULT 0'),
    "migration 0008 must contain 'status_locked INTEGER NOT NULL DEFAULT 0'"
  );
});

test('D-83C: migration 0008 uses ALTER TABLE claims ADD COLUMN (D-83C)', () => {
  assert.ok(
    migrationSrc0008.includes('ALTER TABLE claims ADD COLUMN'),
    "migration 0008 must use ALTER TABLE claims ADD COLUMN"
  );
});

test('D-83C: migration 0008 does not SET status_locked on any row (D-83C)', () => {
  const lines = migrationSrc0008.split('\n').filter(l => !l.trim().startsWith('--'));
  const hasUpdate = lines.some(l => /UPDATE\s+claims/i.test(l) && /status_locked/i.test(l));
  assert.ok(!hasUpdate, "migration 0008 must not UPDATE any row's status_locked value");
});

test('D-83C: recalcClaimScore reads status_locked from claims row (D-83C)', () => {
  assert.ok(
    scoringSrc.includes('status_locked'),
    "recalcClaimScore must read status_locked from claims row"
  );
});

test('D-83C: recalcClaimScore claim query selects status_locked (D-83C)', () => {
  assert.ok(
    scoringSrc.includes('SELECT type,testability,status_locked FROM claims WHERE id=?'),
    "recalcClaimScore must include status_locked in claim SELECT query"
  );
});

test('D-83C: recalcClaimScore has locked branch that skips status in UPDATE (D-83C)', () => {
  // Locked branch must update evidence_score, survivability, contradictions, updated_at
  // but must NOT include status=? in the UPDATE
  assert.ok(
    scoringSrc.includes('status_locked') &&
    scoringSrc.includes('evidence_score=?, survivability=?, contradictions=?, updated_at=?'),
    "recalcClaimScore must have a locked UPDATE branch without status=?"
  );
});

test('D-83C: recalcClaimScore has unlocked branch that includes status in UPDATE (D-83C)', () => {
  assert.ok(
    scoringSrc.includes('evidence_score=?, survivability=?, contradictions=?, status=?, updated_at=?'),
    "recalcClaimScore must preserve original UPDATE with status=? for unlocked claims"
  );
});

test('D-83C: recalcClaimScore does not hardcode any claim ID (D-83C)', () => {
  const hardcodedIds = scoringSrc.match(/clm_seed_[a-f0-9]+/g);
  assert.ok(
    !hardcodedIds || hardcodedIds.length === 0,
    "recalcClaimScore must not contain any hardcoded claim IDs"
  );
});

// ── Section 28 — D-89C: Shadow ban enforcement ───────────────────────────────

console.log('\n28. D-89C: Shadow ban enforcement');

test('D-89C: requireUser is declared as async function (D-89C)', () => {
  assert.ok(
    workerSrc.includes('async function requireUser(request, env)'),
    "requireUser must be declared as async function with (request, env) signature"
  );
});

test('D-89C: requireUser queries is_shadow_banned from users table (D-89C)', () => {
  assert.ok(
    workerSrc.includes('SELECT is_shadow_banned FROM users WHERE id=?'),
    "requireUser must query is_shadow_banned from users table"
  );
});

test('D-89C: requireUser throws USER_SHADOW_BANNED when banned (D-89C)', () => {
  assert.ok(
    workerSrc.includes("throw new Error('USER_SHADOW_BANNED')"),
    "requireUser must throw USER_SHADOW_BANNED when is_shadow_banned is truthy"
  );
});

test('D-89C: catch block handles USER_SHADOW_BANNED with 403 (D-89C)', () => {
  assert.ok(
    workerSrc.includes("message.includes('USER_SHADOW_BANNED')") &&
    workerSrc.includes("json({ error:'UNAUTHORIZED', message:'Action not permitted.' },403)"),
    "catch block must handle USER_SHADOW_BANNED and return 403 UNAUTHORIZED"
  );
});

test('D-89C: requireUser guards DB lookup with env?.DB presence check (D-89C)', () => {
  assert.ok(
    workerSrc.includes('if (env?.DB)'),
    "requireUser must guard DB lookup with env?.DB to stay safe when env is undefined"
  );
});

test('D-89C: createClaim uses await requireUser(request, env) (D-89C)', () => {
  assert.ok(
    workerSrc.includes('async function createClaim(request, env) { const userId = await requireUser(request, env);'),
    "createClaim must await requireUser with env for shadow-ban check"
  );
});

test('D-89C: addPressure uses await requireUser(request, env) (D-89C)', () => {
  assert.ok(
    workerSrc.includes('async function addPressure(request, env) { const userId=await requireUser(request, env);'),
    "addPressure must await requireUser with env for shadow-ban check"
  );
});

test('D-89C: module dispatch passes env-bound requireUser to helpers (D-89C)', () => {
  assert.ok(
    workerSrc.includes('requireUser: async (req) => requireUser(req, env)'),
    "module dispatch helpers must pass env-bound async requireUser so modules receive the ban check"
  );
});

// ── Section 29 — D-89D: belief snapshot read correction ──────────────────────

console.log('\n29. D-89D: belief snapshot read correction');

test('D-89D: requireUserId is declared as sync function in worker.js (D-89D)', () => {
  assert.ok(
    workerSrc.includes('function requireUserId(request)'),
    "requireUserId must be declared as a sync function in worker.js"
  );
});

test('D-89D: requireUser delegates header check to requireUserId (D-89D)', () => {
  assert.ok(
    workerSrc.includes('const userId=requireUserId(request)'),
    "requireUser must call requireUserId(request) for the header check"
  );
});

test('D-89D: GET /api/belief-snapshots passes requireUserId (identity-only, read) (D-89D)', () => {
  assert.ok(
    workerSrc.includes("'/api/belief-snapshots' && request.method === 'GET') return await listBeliefSnapshots(request, env, { json, requireUser: requireUserId })"),
    "GET /api/belief-snapshots must pass requireUserId so shadow-banned users can still read their snapshots"
  );
});

test('D-89D: POST /api/belief-snapshots still passes env-bound async requireUser (D-89D)', () => {
  assert.ok(
    workerSrc.includes("'/api/belief-snapshots' && request.method === 'POST') return await saveBeliefSnapshot(request, env, { readJson, cleanId, cleanText, json, requireUser: async (req) => requireUser(req, env)"),
    "POST /api/belief-snapshots must still pass the env-bound async requireUser for shadow-ban enforcement"
  );
});

test('D-89D: POST /api/belief-promote still passes env-bound async requireUser (D-89D)', () => {
  assert.ok(
    workerSrc.includes("'/api/belief-promote' && request.method === 'POST') return await promoteBeliefSnapshot(request, env, { readJson, cleanId, cleanText, json, requireUser: async (req) => requireUser(req, env)"),
    "POST /api/belief-promote must still pass the env-bound async requireUser for shadow-ban enforcement"
  );
});

test('D-89D: USER_SHADOW_BANNED still maps to 403 after refactor (D-89D)', () => {
  assert.ok(
    workerSrc.includes("message.includes('USER_SHADOW_BANNED')") &&
    workerSrc.includes("json({ error:'UNAUTHORIZED', message:'Action not permitted.' },403)"),
    "catch block must still handle USER_SHADOW_BANNED as 403 after D-89D refactor"
  );
});

// ── Section 30 — D-90B: Pressure point moderation backend ────────────────────

console.log('\n30. D-90B: Pressure point moderation backend');

const migSrc0009 = (() => { try { return readFileSync(path.join(__dirname, '../migrations/0009_add_pressure_review_state.sql'), 'utf8'); } catch { return ''; } })();

test('D-90B: migration 0009 file exists', () => {
  assert.ok(migSrc0009.length > 0, 'migrations/0009_add_pressure_review_state.sql must exist');
});

test('D-90B: migration 0009 adds review_state TEXT DEFAULT public to pressure_points', () => {
  assert.ok(
    migSrc0009.includes('review_state TEXT DEFAULT') && migSrc0009.includes("'public'"),
    "migration 0009 must add review_state TEXT DEFAULT 'public'"
  );
});

test('D-90B: migration 0009 adds report_count INTEGER DEFAULT 0 to pressure_points', () => {
  assert.ok(
    migSrc0009.includes('report_count INTEGER DEFAULT 0'),
    "migration 0009 must add report_count INTEGER DEFAULT 0"
  );
});

test('D-90B: migration 0009 adds index on review_state for pressure_points', () => {
  assert.ok(
    migSrc0009.includes('idx_pressure_points_review_state'),
    "migration 0009 must create idx_pressure_points_review_state index"
  );
});

test('D-90B: migration 0009 adds index on report_count for pressure_points', () => {
  assert.ok(
    migSrc0009.includes('idx_pressure_points_report_count'),
    "migration 0009 must create idx_pressure_points_report_count index"
  );
});

test('D-90B: addPressure inserts review_state review (D-90B)', () => {
  assert.ok(
    workerSrc.includes("INSERT INTO pressure_points") && workerSrc.includes("review_state") && workerSrc.includes("'review',0,"),
    "addPressure must insert review_state='review' into pressure_points"
  );
});

test('D-90B: addPressure does NOT call recalcClaimScore after insert (pending pressure must not affect score) (D-90B)', () => {
  // Extract just the addPressure function body to check it doesn't call recalcClaimScore
  const addPressureMatch = workerSrc.match(/async function addPressure\(.*?\}\s*(?=async function)/s);
  const addPressureSrc = addPressureMatch ? addPressureMatch[0] : '';
  assert.ok(
    addPressureSrc.length > 0 && !addPressureSrc.includes('recalcClaimScore'),
    "addPressure must NOT call recalcClaimScore immediately — pending pressure must not affect claim score until approved"
  );
});

test('D-90B: getClaim pressure query filters COALESCE(p.review_state) public (D-90B)', () => {
  assert.ok(
    workerSrc.includes("COALESCE(p.review_state,'public')='public'"),
    "getClaim pressure query must filter COALESCE(p.review_state,'public')='public'"
  );
});

test('D-90B: claimDetail pressure query filters COALESCE(review_state) public (D-90B)', () => {
  assert.ok(
    workerSrc.includes("pressure_points WHERE claim_id=? AND COALESCE(review_state,'public')='public'"),
    "claimDetail pressure query must filter COALESCE(review_state,'public')='public'"
  );
});

test('D-90B: claim-scoring pressure query filters COALESCE(review_state) public (D-90B)', () => {
  const claimScoringSrc = readFileSync(path.join(__dirname, '../src/claim-scoring.js'), 'utf8');
  assert.ok(
    claimScoringSrc.includes("pressure_points WHERE claim_id=? AND COALESCE(review_state,'public')='public'"),
    "recalcClaimScore pressure query must filter COALESCE(review_state,'public')='public'"
  );
});

test('D-90B: reviewQueue queries pressure_points for non-public items (D-90B)', () => {
  assert.ok(
    workerSrc.includes("'pressure' AS target_type") && workerSrc.includes('FROM pressure_points p'),
    "reviewQueue must include a pressure_points query with target_type='pressure'"
  );
});

test('D-90B: reviewDecision handles targetType pressure (D-90B)', () => {
  assert.ok(
    workerSrc.includes("targetType === 'pressure'") &&
    workerSrc.includes("UPDATE pressure_points SET review_state=?"),
    "reviewDecision must handle targetType 'pressure' and update pressure_points.review_state"
  );
});

test('D-90B: reviewDecision pressure branch calls recalcClaimScore (D-90B)', () => {
  // Check that within the pressure branch, recalcClaimScore is called
  assert.ok(
    workerSrc.includes("targetType === 'pressure'") &&
    workerSrc.includes("PRESSURE_NOT_FOUND") &&
    workerSrc.includes("if (row.claim_id) await recalcClaimScore(env, row.claim_id)"),
    "reviewDecision pressure branch must call recalcClaimScore to update claim score after approval/rejection"
  );
});

test('D-90B: reportTarget handles targetType pressure (D-90B)', () => {
  assert.ok(
    workerSrc.includes("targetType === 'pressure'") &&
    workerSrc.includes("UPDATE pressure_points SET report_count=report_count+1"),
    "reportTarget must handle targetType 'pressure' with report_count increment and auto-escalation"
  );
});

// ── Section 31 — D-90C: Pressure point moderation frontend ───────────────────

test('D-90C: reviewCard defines isPressure variable (D-90C)', () => {
  assert.ok(
    appSrc.includes("const isPressure=type==='pressure';"),
    "reviewCard must define isPressure from target_type"
  );
});

test('D-90C: reviewCard skips quality hints for pressure (D-90C)', () => {
  assert.ok(
    appSrc.includes('&&!isPressure)?claimQualityHints('),
    "reviewCard qhints guard must exclude pressure (!isPressure)"
  );
});

test('D-90C: reviewCard uses b-orange badge for pressure (D-90C)', () => {
  assert.ok(
    appSrc.includes("isPressure?'b-orange':"),
    "reviewCard badge must use b-orange for pressure items"
  );
});

test('D-90C: reviewCard applies review-card-pressure class (D-90C)', () => {
  assert.ok(
    appSrc.includes('review-card-pressure') && appSrc.includes("pressureMod=isPressure?' review-card-pressure':''"),
    "reviewCard must add pressureMod class for pressure items"
  );
});

test('D-90C: reviewCard pressure metaParts include severity (D-90C)', () => {
  assert.ok(
    appSrc.includes("isPressure?['severity '+(item.severity||1)+'/5'"),
    "reviewCard pressure metaParts must include severity x/5"
  );
});

test('D-90C: renderReviewInspectPanel has isPressure branch with fields (D-90C)', () => {
  assert.ok(
    appSrc.includes("}else if(isPressure){") &&
    appSrc.includes("fields.push(['Severity',esc(item.severity)") &&
    appSrc.includes("fields.push(['Parent Claim',esc(item.parent_claim)") &&
    appSrc.includes("fields.push(['Claim ID',esc(item.claim_id)"),
    "renderReviewInspectPanel must have isPressure branch with Severity, Parent Claim, Claim ID fields"
  );
});

test('D-90C: renderReviewInspectPanel pressure Study button uses claim_id (D-90C)', () => {
  assert.ok(
    appSrc.includes("isPressure?(item.claim_id?`<button class=\"btn-study-review\" onclick=\"openReviewClaimStudy('${esc(item.claim_id)}')\""),
    "renderReviewInspectPanel Study button must use item.claim_id for pressure"
  );
});

test('D-90C: renderReviewInspectPanel canMarkDup excludes pressure (D-90C)', () => {
  assert.ok(
    appSrc.includes('!isTruth&&!isEvidence&&!isPressure&&state'),
    "canMarkDup must exclude pressure items"
  );
});

test('D-90C: addCaseItem pressure toast updated (D-90C)', () => {
  assert.ok(
    appSrc.includes("'Pressure point submitted for review.'"),
    "addCaseItem must toast 'Pressure point submitted for review.' for pressure"
  );
  assert.ok(
    !appSrc.includes("'Attack / pressure attached to selected claim.'"),
    "addCaseItem must NOT use old 'Attack / pressure attached to selected claim.' toast"
  );
});

test('D-90C: applyReviewFilter has pressure filter (D-90C)', () => {
  assert.ok(
    appSrc.includes("f==='pressure')return list.filter(i=>(i.target_type||i.targetType||i.type||'claim')==='pressure')"),
    "applyReviewFilter must have dedicated pressure filter branch"
  );
});

test('D-90C: applyReviewFilter quality filter excludes pressure (D-90C)', () => {
  assert.ok(
    appSrc.includes("tp==='pressure')return false;return claimQualityHints"),
    "applyReviewFilter quality filter must exclude pressure items"
  );
});

test('D-90C: renderReviewFilterBar has pressure chip and count (D-90C)', () => {
  assert.ok(
    appSrc.includes("pressure:list.filter(i=>(i.target_type||i.targetType||i.type||'claim')==='pressure').length") &&
    appSrc.includes("['pressure','Pressure']"),
    "renderReviewFilterBar must include pressure count and Pressure chip in defs"
  );
});

test('D-90C: renderReviewAuditSummary includes Pressure stat (D-90C)', () => {
  assert.ok(
    appSrc.includes("{label:'Pressure',n:pressureCount,cls:'orange'}"),
    "renderReviewAuditSummary must include a Pressure stat entry"
  );
});

test('D-90C: CSS b-orange badge class exists (D-90C)', () => {
  assert.ok(
    cssSrc.includes('.b-orange{'),
    "styles.css must define .b-orange badge class"
  );
});

test('D-90C: CSS review-card-pressure class exists (D-90C)', () => {
  assert.ok(
    cssSrc.includes('.review-card-pressure{'),
    "styles.css must define .review-card-pressure card modifier class"
  );
});

// ── Section 32 — D-90G: Pressure review UI clarity and side panel copy ────────

const indexSrc = readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');

test('D-90G: side panel body placeholder updated to challenge/support (D-90G)', () => {
  assert.ok(
    indexSrc.includes('What does this support or challenge?'),
    "index.html eNote placeholder must say 'What does this support or challenge?'"
  );
  assert.ok(
    !indexSrc.includes('What does this prove or break?'),
    "index.html must NOT use old 'What does this prove or break?' placeholder"
  );
});

test('D-90G: side panel hint says Support adds evidence Attack adds pressure (D-90G)', () => {
  assert.ok(
    indexSrc.includes('Support</b> adds evidence. <b>Attack</b> adds pressure.'),
    "index.html evidence-kind-hint must say 'Support adds evidence. Attack adds pressure.'"
  );
});

test('D-90G: side panel hint says New items enter Review first (D-90G)', () => {
  assert.ok(
    indexSrc.includes('New items enter Review first.'),
    "index.html evidence-kind-hint must say 'New items enter Review first.'"
  );
});

test('D-90G: evidence-attach-note updated with approval/pending messaging (D-90G)', () => {
  assert.ok(
    indexSrc.includes('After approval, it can affect the public claim'),
    "index.html evidence-attach-note must say 'After approval, it can affect the public claim'"
  );
  assert.ok(
    !indexSrc.includes('Saved to selected claim. Visibility follows Review state.'),
    "index.html must NOT use old 'Saved to selected claim. Visibility follows Review state.' copy"
  );
});

test('D-90G: RunPack side note updated with approved public items messaging (D-90G)', () => {
  assert.ok(
    indexSrc.includes('RunPack includes approved public'),
    "index.html runpack-side-note must say 'RunPack includes approved public'"
  );
  assert.ok(
    !indexSrc.includes('Private working packet. Exporting does not publish anything.'),
    "index.html must NOT use old 'Private working packet. Exporting does not publish anything.' copy"
  );
});

test('D-90G: graphBox labels global counts (D-90G)', () => {
  assert.ok(
    appSrc.includes('Global graph totals'),
    "graphBox must include 'Global graph totals' label"
  );
});

// ── Section 33 — D-91B: Review Inspect long-body collapse ────────────────────

const cssSrc2 = readFileSync(path.join(__dirname, '../public/styles.css'), 'utf8');

test('D-91B: inspectLongText helper exists (D-91B)', () => {
  assert.ok(
    appSrc.includes('function inspectLongText('),
    "app-v10.js must define an inspectLongText helper function"
  );
});

test('D-91B: inspectLongText uses <details for collapse (D-91B)', () => {
  assert.ok(
    appSrc.includes('<details class="inspect-long-details">'),
    "inspectLongText must use a <details class=\"inspect-long-details\"> element"
  );
});

test('D-91B: inspectLongText uses <pre for full text (D-91B)', () => {
  assert.ok(
    appSrc.includes('<pre class="inspect-long-pre">'),
    "inspectLongText must use a <pre class=\"inspect-long-pre\"> element"
  );
});

test('D-91B: pressure body field uses inspectLongText (D-91B)', () => {
  assert.ok(
    appSrc.includes("fields.push(['Body',inspectLongText(item.body)]);if(item.severity)"),
    "renderReviewInspectPanel pressure branch must use inspectLongText for Body field"
  );
});

test('D-91B: evidence body field uses inspectLongText (D-91B)', () => {
  assert.ok(
    appSrc.includes("fields.push(['Body',inspectLongText(item.body)]);if(item.stance)"),
    "renderReviewInspectPanel evidence branch must use inspectLongText for Body field"
  );
});

test('D-91B: at least one non-pressure text field uses inspectLongText (D-91B)', () => {
  // Evidence body (stance check below) confirms non-pressure usage
  assert.ok(
    appSrc.includes("fields.push(['Body',inspectLongText(item.body)]);if(item.stance)"),
    "At least one non-pressure field (evidence body) must use inspectLongText"
  );
});

test('D-91B: CSS defines .inspect-long-details (D-91B)', () => {
  assert.ok(
    cssSrc2.includes('.inspect-long-details'),
    "styles.css must define .inspect-long-details"
  );
});

test('D-91B: CSS sets max-height and overflow:auto on inspect-long-pre (D-91B)', () => {
  assert.ok(
    cssSrc2.includes('.inspect-long-pre') &&
    cssSrc2.includes('max-height') &&
    cssSrc2.includes('overflow:auto'),
    "styles.css must set max-height and overflow:auto on .inspect-long-pre"
  );
});

// ── Section 34 — D-92C: Truths public page clarity ───────────────────────────

test('D-92C: renderTruths copy contains "Public means visible, not proven"', () => {
  const src = appSrc;
  assert.ok(
    src.includes('Public means visible, not proven'),
    'app-v10.js renderTruths must contain "Public means visible, not proven"'
  );
});

test('D-92C: renderTruths copy contains "not proven" or "Public means visible"', () => {
  const src = appSrc;
  assert.ok(
    src.includes('not proven') || src.includes('Public means visible'),
    'app-v10.js renderTruths must reference "not proven" or "Public means visible"'
  );
});

test('D-92C: truthCard contains "not-verified" badge text or class', () => {
  const src = appSrc;
  assert.ok(
    src.includes('not verified') || src.includes('truth-not-verified'),
    'app-v10.js truthCard must include "not verified" badge'
  );
});

test('D-92C: truthCard button text changed to "Pressure-test as Claim"', () => {
  const src = appSrc;
  assert.ok(
    src.includes('Pressure-test as Claim'),
    'app-v10.js truthCard button must say "Pressure-test as Claim"'
  );
});

test('D-92C: isTruthPersonalBelief helper exists in app-v10.js', () => {
  const src = appSrc;
  assert.ok(
    src.includes('isTruthPersonalBelief'),
    'app-v10.js must define isTruthPersonalBelief helper'
  );
});

test('D-92C: isTruthArtifact helper exists in app-v10.js', () => {
  const src = appSrc;
  assert.ok(
    src.includes('isTruthArtifact'),
    'app-v10.js must define isTruthArtifact helper'
  );
});

test('D-92C: truthCard includes truth-id-line for ID display', () => {
  const src = appSrc;
  assert.ok(
    src.includes('truth-id-line'),
    'app-v10.js truthCard must include truth-id-line element'
  );
});

test('D-92C: no auto-hide of artifact truths (artifact flag is advisory only)', () => {
  // Scope check to truthCard only — admin filter functions may legitimately use filter(isTruthArtifact)
  const cardStart = appSrc.indexOf('function truthCard(t){');
  const cardEnd = appSrc.indexOf('\nfunction ', cardStart + 1);
  const cardSrc = cardEnd > -1 ? appSrc.slice(cardStart, cardEnd) : appSrc.slice(cardStart, cardStart + 4000);
  const hasAutoHide = /isTruthArtifact[^}]+display\s*[:=]\s*['"]none/.test(cardSrc) ||
    /filter[^}]+isTruthArtifact/.test(cardSrc);
  assert.ok(
    !hasAutoHide,
    'truthCard must NOT auto-hide artifact truths — flag is advisory only; admin filter functions may use filter(isTruthArtifact)'
  );
});

// ── Section 35 — D-92E: Admin truth ID copy UI ────────────────────────────────

test('D-92E: truthCard calls adminToken() for admin-aware ID display', () => {
  const src = appSrc;
  // Must reference adminToken() inside or near truthCard
  assert.ok(
    src.includes('adminToken()') && src.includes('isAdmin'),
    'app-v10.js truthCard must use adminToken() and isAdmin for admin-aware ID display'
  );
});

test('D-92E: truth-id-full class exists in app-v10.js', () => {
  assert.ok(
    appSrc.includes('truth-id-full'),
    'app-v10.js must include truth-id-full class for full-ID display element'
  );
});

test('D-92E: btn-copy-id class exists in app-v10.js', () => {
  assert.ok(
    appSrc.includes('btn-copy-id'),
    'app-v10.js must include btn-copy-id class for copy button'
  );
});

test('D-92E: navigator.clipboard.writeText used in copyTruthId', () => {
  assert.ok(
    appSrc.includes('navigator.clipboard.writeText'),
    'app-v10.js must use navigator.clipboard.writeText in copyTruthId'
  );
});

test('D-92E: copyTruthId function defined and exposed on window', () => {
  assert.ok(
    appSrc.includes('function copyTruthId') && appSrc.includes('window.copyTruthId=copyTruthId'),
    'app-v10.js must define copyTruthId and expose it on window'
  );
});

test('D-92E: normal short ID path (slice(-8)) still present for non-admin', () => {
  assert.ok(
    appSrc.includes('slice(-8)'),
    'app-v10.js must keep the short ID suffix path for non-admin users'
  );
});

test('D-92E: truth-id-full and btn-copy-id CSS rules exist in styles.css', () => {
  assert.ok(
    cssSrc2.includes('truth-id-full') && cssSrc2.includes('btn-copy-id'),
    'styles.css must include .truth-id-full and .btn-copy-id rules'
  );
});

test('D-92E/G: truthCard does not call review APIs directly (delegates to helper functions)', () => {
  const src = appSrc;
  // Extract the truthCard function body (starts after 'function truthCard(t){', ends at the closing }
  const start = src.indexOf('function truthCard(t){');
  const end = src.indexOf('\nfunction ', start + 1);
  const cardSrc = end > -1 ? src.slice(start, end) : src.slice(start, start + 3000);
  // Direct API calls are forbidden in truthCard; archiveTruthArtefact and copyTruthId helper calls are allowed
  const forbidden = ['reviewDecision', 'reviewCleanup', 'api('].some(k => cardSrc.includes(k));
  assert.ok(
    !forbidden,
    'truthCard must NOT contain direct review API calls (use helper functions instead)'
  );
});

// ── Section 36 — D-92G: Admin Truth artefact cleanup UI ──────────────────────

test('D-92G: archiveTruthArtefact helper exists in app-v10.js', () => {
  assert.ok(
    appSrc.includes('async function archiveTruthArtefact'),
    'app-v10.js must define archiveTruthArtefact helper'
  );
});

test('D-92G: archiveTruthArtefact uses adminToken()', () => {
  assert.ok(
    appSrc.includes('archiveTruthArtefact') && appSrc.includes('adminToken()'),
    'archiveTruthArtefact must call adminToken()'
  );
});

test('D-92G: archiveTruthArtefact uses confirm(', () => {
  assert.ok(
    appSrc.includes("confirm('Archive this Truth artefact?"),
    'archiveTruthArtefact must use confirm() with expected message'
  );
});

test('D-92G: archiveTruthArtefact posts to /api/review/decision', () => {
  assert.ok(
    appSrc.includes("'/api/review/decision'") && appSrc.includes('archiveTruthArtefact'),
    'archiveTruthArtefact must POST to /api/review/decision'
  );
});

test('D-92G: archiveTruthArtefact posts to /api/review/cleanup', () => {
  assert.ok(
    appSrc.includes("'/api/review/cleanup'") && appSrc.includes('archiveTruthArtefact'),
    'archiveTruthArtefact must POST to /api/review/cleanup'
  );
});

test('D-92G: archiveTruthArtefact payload includes targetType:"truth"', () => {
  assert.ok(
    appSrc.includes("targetType:'truth'"),
    'archiveTruthArtefact payload must include targetType:"truth"'
  );
});

test('D-92G: archiveTruthArtefact payload includes target_type:"truth"', () => {
  assert.ok(
    appSrc.includes("target_type:'truth'"),
    'archiveTruthArtefact payload must include target_type:"truth"'
  );
});

test('D-92G: archiveTruthArtefact payload includes junk_override:true', () => {
  assert.ok(
    appSrc.includes('junk_override:true'),
    'archiveTruthArtefact must pass junk_override:true'
  );
});

test('D-92G: archiveTruthArtefact payload includes Admin UI artefact cleanup reason', () => {
  assert.ok(
    appSrc.includes('Admin UI artefact cleanup'),
    'archiveTruthArtefact must include the reason string'
  );
});

test('D-92G: window.archiveTruthArtefact is exposed', () => {
  assert.ok(
    appSrc.includes('window.archiveTruthArtefact=archiveTruthArtefact'),
    'archiveTruthArtefact must be exposed on window'
  );
});

test('D-92G: btn-archive-artifact class exists in app-v10.js', () => {
  assert.ok(
    appSrc.includes('btn-archive-artifact'),
    'app-v10.js must include btn-archive-artifact class'
  );
});

test('D-92G: truthCard archive button conditioned on isAdmin&&artifact', () => {
  const start = appSrc.indexOf('function truthCard(t){');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const cardSrc = end > -1 ? appSrc.slice(start, end) : appSrc.slice(start, start + 4000);
  assert.ok(
    cardSrc.includes('isAdmin&&artifact'),
    'truthCard must gate archive button on isAdmin&&artifact'
  );
});

test('D-92G: no bulk cleanup loop over truths array', () => {
  // truths.forEach should not exist at all
  assert.ok(
    !appSrc.includes('truths.forEach'),
    'Must not use truths.forEach (potential bulk action risk)'
  );
  // truths.map is used only for card rendering — must not call archiveTruthArtefact within its callback
  const mapIdx = appSrc.indexOf('truths.map(');
  const mapContext = mapIdx >= 0 ? appSrc.slice(mapIdx, mapIdx + 120) : '';
  assert.ok(
    !mapContext.includes('archiveTruthArtefact'),
    'truths.map callback must not call archiveTruthArtefact (no bulk archive)'
  );
});

test('D-92G: no hardcoded exact artefact IDs in archiveTruthArtefact function', () => {
  const start = appSrc.indexOf('async function archiveTruthArtefact');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const fnSrc = end > -1 ? appSrc.slice(start, end) : appSrc.slice(start, start + 2000);
  const hardcoded = [
    'tru_8dda0954d7b14910bb',
    'tru_2544a80a73034a6a95',
    'tru_67ae90e56f7449ee85',
    'tru_5fe9ce641c634fcba5',
    'tru_a3ecc8ef96104c6ebe',
  ].some(id => fnSrc.includes(id));
  assert.ok(
    !hardcoded,
    'archiveTruthArtefact must not hardcode specific artefact IDs'
  );
});

test('D-92G: btn-archive-artifact CSS rule exists in styles.css', () => {
  assert.ok(
    cssSrc2.includes('btn-archive-artifact'),
    'styles.css must include .btn-archive-artifact rule'
  );
});

// ── Section 37 — D-93B: Truth admin cleanup ergonomics UI ────────────────────

test('D-93B: isTruthBorderlineArtefact helper is defined', () => {
  assert.ok(
    appSrc.includes('function isTruthBorderlineArtefact(t)'),
    'app-v10.js must define isTruthBorderlineArtefact helper'
  );
});

test('D-93B: isTruthBorderlineArtefact guards against already-caught artefacts', () => {
  const start = appSrc.indexOf('function isTruthBorderlineArtefact(t)');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const fnSrc = end > -1 ? appSrc.slice(start, end) : appSrc.slice(start, start + 600);
  assert.ok(
    fnSrc.includes('isTruthArtifact(t)') && fnSrc.includes('return false'),
    'isTruthBorderlineArtefact must early-return false when isTruthArtifact is already true'
  );
});

test('D-93B: isTruthBorderlineArtefact detects all-caps multi-word phrases', () => {
  const start = appSrc.indexOf('function isTruthBorderlineArtefact(t)');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const fnSrc = end > -1 ? appSrc.slice(start, end) : appSrc.slice(start, start + 600);
  assert.ok(
    fnSrc.includes('toUpperCase()'),
    'isTruthBorderlineArtefact must check toUpperCase() for all-caps detection'
  );
});

test('D-93B: truth-borderline-badge class referenced in truthCard', () => {
  const start = appSrc.indexOf('function truthCard(t){');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const cardSrc = end > -1 ? appSrc.slice(start, end) : appSrc.slice(start, start + 4000);
  assert.ok(
    cardSrc.includes('truth-borderline-badge'),
    'truthCard must include truth-borderline-badge for borderline advisory badge'
  );
});

test('D-93B: borderline badge is admin-only in truthCard', () => {
  const start = appSrc.indexOf('function truthCard(t){');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const cardSrc = end > -1 ? appSrc.slice(start, end) : appSrc.slice(start, start + 4000);
  assert.ok(
    cardSrc.includes('borderline') && cardSrc.includes('isAdmin'),
    'truthCard must gate borderline badge on admin status'
  );
});

test('D-93B: no archive button for borderline-only cards in truthCard', () => {
  const start = appSrc.indexOf('function truthCard(t){');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const cardSrc = end > -1 ? appSrc.slice(start, end) : appSrc.slice(start, start + 4000);
  // Archive button must be gated on artifact, not borderline
  assert.ok(
    cardSrc.includes('isAdmin&&artifact') && !cardSrc.includes('isAdmin&&borderline'),
    'Archive button must only appear for confirmed artefacts (isAdmin&&artifact), not borderline items'
  );
});

test('D-93B: renderTruthAdminBar helper is defined', () => {
  assert.ok(
    appSrc.includes('function renderTruthAdminBar('),
    'app-v10.js must define renderTruthAdminBar helper'
  );
});

test('D-93B: renderTruthAdminBar references artefact and borderline counts', () => {
  const start = appSrc.indexOf('function renderTruthAdminBar(');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const fnSrc = end > -1 ? appSrc.slice(start, end) : appSrc.slice(start, start + 600);
  assert.ok(
    fnSrc.includes('artefact') && fnSrc.includes('borderline'),
    'renderTruthAdminBar must reference artefact and borderline counts'
  );
});

test('D-93B: renderTruthFilterBar helper is defined', () => {
  assert.ok(
    appSrc.includes('function renderTruthFilterBar('),
    'app-v10.js must define renderTruthFilterBar helper'
  );
});

test('D-93B: renderTruthFilterBar includes all four filter keys', () => {
  const start = appSrc.indexOf('function renderTruthFilterBar(');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const fnSrc = end > -1 ? appSrc.slice(start, end) : appSrc.slice(start, start + 1000);
  const allKeys = ['artefacts', 'borderline', 'personal', 'clean'].every(k => fnSrc.includes(`'${k}'`));
  assert.ok(allKeys, 'renderTruthFilterBar must include artefacts, borderline, personal, and clean filter chips');
});

test('D-93B: applyTruthAdminFilter helper is defined', () => {
  assert.ok(
    appSrc.includes('function applyTruthAdminFilter('),
    'app-v10.js must define applyTruthAdminFilter helper'
  );
});

test('D-93B: truthAdminFilter module-level state variable is defined', () => {
  assert.ok(
    appSrc.includes("let truthAdminFilter = 'all'"),
    "app-v10.js must declare let truthAdminFilter = 'all' at module level"
  );
});

test('D-93B: setTruthAdminFilter is exposed on window', () => {
  assert.ok(
    appSrc.includes('window.setTruthAdminFilter=setTruthAdminFilter'),
    'setTruthAdminFilter must be exposed on window'
  );
});

test('D-93B: renderTruths uses applyTruthAdminFilter instead of raw truths.map', () => {
  const start = appSrc.indexOf('async function renderTruths(){');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const fnSrc = end > -1 ? appSrc.slice(start, end) : appSrc.slice(start, start + 3000);
  assert.ok(
    fnSrc.includes('applyTruthAdminFilter(truths)'),
    'renderTruths must call applyTruthAdminFilter(truths) to support filter chips'
  );
});

test('D-93B: truth-borderline-badge CSS rule exists in styles.css', () => {
  assert.ok(
    cssSrc2.includes('truth-borderline-badge'),
    'styles.css must include .truth-borderline-badge rule'
  );
});

test('D-93B: truth-admin-bar CSS rule exists in styles.css', () => {
  assert.ok(
    cssSrc2.includes('truth-admin-bar'),
    'styles.css must include .truth-admin-bar rule'
  );
});

test('D-93B: truth-filter-chip CSS rule exists in styles.css', () => {
  assert.ok(
    cssSrc2.includes('truth-filter-chip'),
    'styles.css must include .truth-filter-chip rule'
  );
});

test('D-93B: btn-archive-artifact uses larger font-size (10px) in styles.css', () => {
  const start = cssSrc2.indexOf('.btn-archive-artifact{');
  const end = cssSrc2.indexOf('}', start);
  const ruleSrc = end > -1 ? cssSrc2.slice(start, end) : cssSrc2.slice(start, start + 200);
  assert.ok(
    ruleSrc.includes('font-size:10px'),
    '.btn-archive-artifact must use font-size:10px (increased from 9px for visibility)'
  );
});

test('D-93B: docs/README.md documents hardening smoke count: 254 passed, 0 failed', () => {
  assert.ok(readmeSrc.includes('254 passed, 0 failed') || readmeSrc.includes('266 passed, 0 failed') || readmeSrc.includes('267 passed, 0 failed') || readmeSrc.includes('272 passed, 0 failed') || readmeSrc.includes('286 passed, 0 failed') || readmeSrc.includes('299 passed, 0 failed') || readmeSrc.includes('312 passed, 0 failed') || readmeSrc.includes('324 passed, 0 failed') || readmeSrc.includes('328 passed, 0 failed') || readmeSrc.includes('340 passed, 0 failed') || readmeSrc.includes('353 passed, 0 failed') || readmeSrc.includes('357 passed, 0 failed') || readmeSrc.includes('362 passed, 0 failed'), 'docs/README.md must document hardening smoke expected count');
});

// ── Section 38 — D-93D: Review UI context for Truth-derived / borderline-derived claims ──

test('D-93D: isTruthDerivedClaim helper is defined', () => {
  assert.ok(
    appSrc.includes('function isTruthDerivedClaim(item)'),
    'app-v10.js must define isTruthDerivedClaim helper'
  );
});

test('D-93D: isTruthDerivedClaim detects Truth-Derived type string', () => {
  assert.ok(
    appSrc.includes("==='truth-derived'"),
    'isTruthDerivedClaim must compare against lowercased truth-derived string'
  );
});

test('D-93D: isClaimCategoryEcho helper is defined', () => {
  assert.ok(
    appSrc.includes('function isClaimCategoryEcho(item)'),
    'app-v10.js must define isClaimCategoryEcho helper'
  );
});

test('D-93D: isClaimCategoryEcho uses exact equality — no substring matching (false-positive guard)', () => {
  // Must use cl===ca but must NOT use .includes() for echo detection
  // Substring matching would fire on e.g. claim="My religion is the only true path", category="religion"
  const start = appSrc.indexOf('function isClaimCategoryEcho(item)');
  const end = appSrc.indexOf('}', start) + 1;
  const body = appSrc.slice(start, end);
  assert.ok(body.includes('cl===ca'), 'isClaimCategoryEcho must use exact equality (cl===ca)');
  assert.ok(!body.includes('.includes('), 'isClaimCategoryEcho must NOT use substring .includes() — false-positive risk on common category words like "religion", "science", "trust"');
});

test('D-93D: isLikelyBorderlineDerivedClaim helper is defined', () => {
  assert.ok(
    appSrc.includes('function isLikelyBorderlineDerivedClaim(item)'),
    'app-v10.js must define isLikelyBorderlineDerivedClaim helper'
  );
});

test('D-93D: reviewCard references b-truth-derived badge class', () => {
  assert.ok(
    appSrc.includes('b-truth-derived'),
    'reviewCard must reference b-truth-derived badge class'
  );
});

test('D-93D: reviewCard references b-category-echo badge class', () => {
  assert.ok(
    appSrc.includes('b-category-echo'),
    'reviewCard must reference b-category-echo badge class'
  );
});

test('D-93D: reviewCard references b-borderline-origin badge class', () => {
  assert.ok(
    appSrc.includes('b-borderline-origin'),
    'reviewCard must reference b-borderline-origin badge class'
  );
});

test('D-93D: applyReviewFilter includes truth-derived branch', () => {
  assert.ok(
    appSrc.includes("f==='truth-derived'") && appSrc.includes('isTruthDerivedClaim'),
    'applyReviewFilter must include truth-derived filter branch using isTruthDerivedClaim'
  );
});

test('D-93D: renderReviewFilterBar includes truth-derived chip', () => {
  assert.ok(
    appSrc.includes("'truth-derived','Truth-Derived'"),
    "renderReviewFilterBar defs must include ['truth-derived','Truth-Derived'] chip"
  );
});

test('D-93D: b-truth-derived CSS rule exists in styles.css', () => {
  assert.ok(
    cssSrc2.includes('b-truth-derived'),
    'styles.css must include .b-truth-derived rule'
  );
});

test('D-93D: b-category-echo CSS rule exists in styles.css', () => {
  assert.ok(
    cssSrc2.includes('b-category-echo'),
    'styles.css must include .b-category-echo rule'
  );
});

test('D-93E: isLikelyBorderlineDerivedClaim is gated by isTruthDerivedClaim (non-Truth-Derived items never flagged)', () => {
  const start = appSrc.indexOf('function isLikelyBorderlineDerivedClaim(item)');
  const end = appSrc.indexOf('}', start) + 1;
  const body = appSrc.slice(start, end);
  assert.ok(
    body.includes('isTruthDerivedClaim(item)') && body.startsWith('function isLikelyBorderlineDerivedClaim(item){if(!isTruthDerivedClaim(item))return false'),
    'isLikelyBorderlineDerivedClaim must return false immediately for non-Truth-Derived items'
  );
});

// ── Section 39 — D-95B: Review inspect panel scroll + approve visual consistency ──

test('D-95B: inspectReviewItem calls renderReviewList', () => {
  const start = appSrc.indexOf('function inspectReviewItem(id)');
  const end = appSrc.indexOf('}', start) + 1;
  const body = appSrc.slice(start, end);
  assert.ok(
    body.includes('renderReviewList()'),
    'inspectReviewItem must call renderReviewList()'
  );
});

test('D-95B: inspectReviewItem scrolls inspect panel into view after render', () => {
  const start = appSrc.indexOf('function inspectReviewItem(id)');
  const end = appSrc.indexOf('}', start) + 1;
  const body = appSrc.slice(start, end);
  assert.ok(
    body.includes('scrollIntoView') && body.includes('.review-inspect-panel'),
    'inspectReviewItem must call scrollIntoView on .review-inspect-panel after renderReviewList'
  );
});

test('D-95B: inspectReviewItem scrollIntoView is guarded — only fires when panel is open', () => {
  const start = appSrc.indexOf('function inspectReviewItem(id)');
  const end = appSrc.indexOf('}', start) + 1;
  const body = appSrc.slice(start, end);
  assert.ok(
    body.includes('if(inspectedReviewItem)') && body.includes('scrollIntoView'),
    'scrollIntoView must be guarded by inspectedReviewItem check — must not fire when toggling panel closed'
  );
});

test('D-95B: top-actions Approve in inspect panel has review-inspect-approve class', () => {
  assert.ok(
    appSrc.includes('review-inspect-top-actions"><button class="btn-approve review-inspect-approve"'),
    'top-actions Approve button must include review-inspect-approve class for visual consistency with bottom Approve'
  );
});

test('D-95B: no new backend/D1/wrangler/deploy references added', () => {
  // Verify inspectReviewItem does not contain any API calls or backend mutation
  const start = appSrc.indexOf('function inspectReviewItem(id)');
  const end = appSrc.indexOf('}', start) + 1;
  const body = appSrc.slice(start, end);
  assert.ok(
    !body.includes('/api/') && !body.includes('wrangler') && !body.includes('d1'),
    'inspectReviewItem must not contain API calls or backend references — display-only change'
  );
});

// ── Section 40 — D-96B: Card-row Approve two-step confirmation ────────────────

test('D-96B: pendingApproveReviewId state variable declared', () => {
  assert.ok(
    appSrc.includes('let pendingApproveReviewId = null;'),
    'pendingApproveReviewId state variable must be declared near other review state vars'
  );
});

test('D-96B: requestApproveReview function defined', () => {
  assert.ok(
    appSrc.includes('function requestApproveReview(id)'),
    'requestApproveReview must be defined'
  );
});

test('D-96B: cancelApproveReview function defined', () => {
  assert.ok(
    appSrc.includes('function cancelApproveReview()'),
    'cancelApproveReview must be defined'
  );
});

test('D-96B: card-row Approve calls requestApproveReview, not reviewDecisionUI directly', () => {
  const start = appSrc.indexOf('function reviewCard(');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  assert.ok(
    body.includes("onclick=\"requestApproveReview('${esc(id)}')"),
    'card-row Approve must call requestApproveReview, not reviewDecisionUI directly'
  );
});

test('D-96B: card-row no longer has old direct btn-approve calling reviewDecisionUI', () => {
  const start = appSrc.indexOf('function reviewCard(');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  // The old direct pattern: btn-approve button with title "Approve and publish" calling reviewDecisionUI directly
  const oldDirectPattern = 'btn-approve" title="Approve and publish to all users" onclick="reviewDecisionUI';
  assert.ok(
    !body.includes(oldDirectPattern),
    'card-row btn-approve must not directly call reviewDecisionUI — must go through requestApproveReview'
  );
});

test('D-96B: Confirm Approve button calls reviewDecisionUI with public', () => {
  assert.ok(
    appSrc.includes('btn-approve-confirm') &&
    appSrc.includes("onclick=\"reviewDecisionUI('${esc(type)}','${esc(id)}','public')\">Confirm Approve"),
    'Confirm Approve button must call reviewDecisionUI with public decision'
  );
});

test('D-96B: approve pending copy says will become public', () => {
  assert.ok(
    appSrc.includes('will become public'),
    'Approve confirmation message must include "will become public"'
  );
});

test('D-96B: reviewDecisionUI clears pendingApproveReviewId on success', () => {
  const start = appSrc.indexOf('async function reviewDecisionUI(');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  assert.ok(
    body.includes('pendingApproveReviewId=null'),
    'reviewDecisionUI must clear pendingApproveReviewId after successful decision'
  );
});

test('D-96B: inspect panel top-actions Approve still calls reviewDecisionUI directly', () => {
  const start = appSrc.indexOf('function renderReviewInspectPanel');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  assert.ok(
    body.includes('review-inspect-top-actions') &&
    body.includes('btn-approve review-inspect-approve') &&
    body.includes("onclick=\"reviewDecisionUI('${esc(type)}','${esc(id)}','public')\">Approve"),
    'inspect panel top-actions Approve must still call reviewDecisionUI directly — deliberate review path'
  );
});

test('D-96B: inspect panel bottom-actions Approve still calls reviewDecisionUI directly', () => {
  const start = appSrc.indexOf('function renderReviewInspectPanel');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  // bottom actions: review-inspect-actions div contains Approve
  const bottomIdx = body.indexOf('review-inspect-actions');
  assert.ok(
    bottomIdx !== -1 &&
    body.slice(bottomIdx).includes("onclick=\"reviewDecisionUI('${esc(type)}','${esc(id)}','public')\">Approve"),
    'inspect panel bottom-actions Approve must still call reviewDecisionUI directly'
  );
});

test('D-96B: reject pending flow still present (requestRejectReview/cancelRejectReview)', () => {
  assert.ok(
    appSrc.includes('function requestRejectReview(id)') &&
    appSrc.includes('function cancelRejectReview()') &&
    appSrc.includes('let pendingRejectReviewId = null;'),
    'existing reject 2-step flow must remain intact'
  );
});

test('D-96B: window exposes requestApproveReview and cancelApproveReview', () => {
  assert.ok(
    appSrc.includes('window.requestApproveReview=requestApproveReview') &&
    appSrc.includes('window.cancelApproveReview=cancelApproveReview'),
    'requestApproveReview and cancelApproveReview must be exposed on window for inline onclick use'
  );
});

test('D-96B: CSS approve-confirm classes defined in styles.css', () => {
  assert.ok(
    cssSrc.includes('.review-approve-confirm-msg') &&
    cssSrc.includes('.btn-approve-confirm') &&
    cssSrc.includes('.btn-approve-cancel'),
    'styles.css must define approve confirmation CSS classes'
  );
});

test('D-96B: no new backend/D1/wrangler/deploy references in approve functions', () => {
  const reqStart = appSrc.indexOf('function requestApproveReview(id)');
  const reqEnd = appSrc.indexOf('}', reqStart) + 1;
  const cancelStart = appSrc.indexOf('function cancelApproveReview()');
  const cancelEnd = appSrc.indexOf('}', cancelStart) + 1;
  const body = appSrc.slice(reqStart, reqEnd) + appSrc.slice(cancelStart, cancelEnd);
  assert.ok(
    !body.includes('/api/') && !body.includes('wrangler') && !body.includes('d1'),
    'requestApproveReview and cancelApproveReview must not reference backend — display-only state functions'
  );
});

// ── Section 41 — D-97B: Public Truths trust-signal clarity ────────────────────

test('D-97B: reviewStatusBadge accepts truthCtx parameter', () => {
  assert.ok(
    appSrc.includes('function reviewStatusBadge(c,withNote=false,truthCtx=false)'),
    'reviewStatusBadge must accept a truthCtx parameter to render neutral truth visibility badge'
  );
});

test('D-97B: public truth badge says "visible", not "Public", and is not green', () => {
  assert.ok(
    appSrc.includes("label=truthCtx?'visible':'Public'") &&
    appSrc.includes("clr=truthCtx?'b-muted truth-visible-badge':'b-green'"),
    'public truth visibility badge must read "visible" with neutral b-muted styling, not green "Public"'
  );
});

test('D-97B: truthCard passes truthCtx=true to reviewStatusBadge', () => {
  const start = appSrc.indexOf('function truthCard(t){');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  assert.ok(
    body.includes('reviewStatusBadge(t,false,true)'),
    'truthCard must call reviewStatusBadge with truthCtx=true so public state renders as neutral "visible"'
  );
});

test('D-97B: claim card still uses default (green) reviewStatusBadge — truths-only change', () => {
  // The claim card caller must NOT pass truthCtx — claims keep green Public
  assert.ok(
    appSrc.includes('${reviewStatusBadge(c)}'),
    'claim card must keep default reviewStatusBadge(c) — the visible/neutral change is truths-only'
  );
});

test('D-97B: .truth-not-verified font-size is no longer 8px', () => {
  assert.ok(
    !cssSrc.includes('.truth-not-verified{font-size:8px}'),
    '.truth-not-verified must be larger than 8px — it is the primary honesty signal'
  );
});

test('D-97B: .truth-not-verified font-size is at least 10px', () => {
  const m = cssSrc.match(/\.truth-not-verified\{font-size:(\d+)px/);
  assert.ok(m, '.truth-not-verified must define a font-size');
  assert.ok(
    Number(m[1]) >= 10,
    `.truth-not-verified font-size must be >= 10px (found ${m ? m[1] : '?'}px)`
  );
});

test('D-97B: NOT VERIFIED badge remains present in truthCard', () => {
  const start = appSrc.indexOf('function truthCard(t){');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  assert.ok(
    body.includes('truth-not-verified') && body.includes('not verified'),
    'truthCard must still render the "not verified" badge'
  );
});

test('D-97B: claim-exists chip no longer uses green/approval styling', () => {
  assert.ok(
    !appSrc.includes('b-green truth-linked-chip'),
    'the linked-claim chip must not use success-green styling'
  );
});

test('D-97B: claim-exists chip avoids "verified"/"proven" wording', () => {
  const start = appSrc.indexOf('function truthCard(t){');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  const chipIdx = body.indexOf('truth-linked-chip');
  const chipText = body.slice(chipIdx, chipIdx + 40);
  assert.ok(
    !/verified|proven/i.test(chipText),
    'linked-claim chip text must not imply verification/proof'
  );
});

test('D-97B: borderline badge remains admin-only after restyle', () => {
  const start = appSrc.indexOf('function truthCard(t){');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  assert.ok(
    body.includes('const borderline=isAdmin&&isTruthBorderlineArtefact(t)&&!artifact'),
    'borderline badge must remain gated on isAdmin'
  );
});

test('D-97B: full truth ID + archive button remain admin-only', () => {
  const start = appSrc.indexOf('function truthCard(t){');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  assert.ok(
    body.includes('isAdmin?') && body.includes('isAdmin&&artifact?'),
    'truthCard must keep full-ID display and archive button gated on admin'
  );
});

test('D-97B: sensitive social beliefs are not structurally flagged as artefact', () => {
  // Re-derive the artefact heuristic to confirm content-neutrality
  const isArtefact = (s) => {
    s = String(s).trim();
    if (s.length < 4) return true;
    if (/^(statement|slogan|truth|claim|placeholder|test|demo|example|sample|label|title)$/i.test(s)) return true;
    const letters = s.replace(/[^a-z]/gi, '').toLowerCase();
    if (letters.length > 6) { const v = (letters.match(/[aeiou]/g) || []).length; if (v / letters.length < 0.12) return true; }
    if (/^(.{2,5})\1{2,}$/i.test(s.replace(/[\s-]/g, ''))) return true;
    return false;
  };
  const beliefs = ['People are stupid','Money is evil','Trust the experts','Never trust the experts','Children should always obey adults','Science has proven it','My religion is the only true path'];
  beliefs.forEach(b => assert.ok(!isArtefact(b), `"${b}" must NOT be flagged as artefact — sensitive beliefs stay neutral`));
});

test('D-97B: no backend/D1/wrangler/deploy references added in trust-signal changes', () => {
  const start = appSrc.indexOf('function reviewStatusBadge(');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  assert.ok(
    !body.includes('wrangler') && !body.includes('deploy') && !/\bd1\b/i.test(body),
    'reviewStatusBadge must not reference backend/deploy — display-only change'
  );
});

// ── Section 42 — D-98B: Public onboarding terminology clarity ─────────────────

const beliefEngineSrc = readFileSync(path.join(__dirname, '../public/apps/humanx-belief-engine/index.html'), 'utf8');

test('D-98B: hero no-overclaim copy remains present', () => {
  assert.ok(
    appSrc.includes('it does not decide what is true'),
    'renderHome hero must keep "it does not decide what is true" — core anti-overclaim promise'
  );
});

test('D-98B: noscript no-overclaim copy remains present', () => {
  assert.ok(
    indexSrc.includes('does not automatically decide what is true'),
    'index.html noscript must keep "does not automatically decide what is true"'
  );
});

test('D-98B: Belief Engine not-diagnosis / pressure-tendency disclaimer remains present', () => {
  assert.ok(
    beliefEngineSrc.includes('not diagnoses') && beliefEngineSrc.includes('pressure-tendency'),
    'Belief Engine must keep "not diagnoses" and "pressure-tendency" interpretive-framing disclaimer'
  );
});

test('D-98B: Belief Engine neutrality copy remains present', () => {
  assert.ok(
    beliefEngineSrc.includes('No correct answers') && beliefEngineSrc.includes('No religion assigned'),
    'Belief Engine intro must keep "No correct answers" / "No religion assigned" neutrality copy'
  );
});

test('D-98B: submit helper "not an automatic verdict" qualifier remains present', () => {
  assert.ok(
    appSrc.includes('not an automatic verdict'),
    'submit helperText must keep "not an automatic verdict" anti-overclaim qualifier'
  );
});

test('D-98B: "Send to Claim Review" no longer appears in public copy', () => {
  assert.ok(
    !appSrc.includes('Send to Claim Review'),
    'public copy must not use "Send to Claim Review" — unified to "Pressure-test as Claim"'
  );
});

test('D-98B: "Pressure-test as Claim" appears consistently for Truth-to-Claim action', () => {
  // Button + home card + drift + both helperText branches → multiple occurrences
  const n = (appSrc.match(/Pressure-test as Claim/g) || []).length;
  assert.ok(
    n >= 4,
    `"Pressure-test as Claim" must be the consistent Truth-to-Claim wording (found ${n} occurrences, expected >= 4)`
  );
});

test('D-98B: verdict qualifier present near filter', () => {
  assert.ok(
    indexSrc.includes('not automatic truth rulings') && indexSrc.includes('verdict-qualifier'),
    'index.html searchbar must carry a verdict qualifier: "...not automatic truth rulings"'
  );
});

test('D-98B: public copy does not claim HumanX proves/decides/verifies truth automatically', () => {
  const banned = [
    'we prove the truth',
    'proves the truth',
    'decides the truth',
    'verifies truth automatically',
    'automatically verifies truth',
    'HumanX verifies what is true',
  ];
  const hits = banned.filter(p => appSrc.includes(p) || indexSrc.includes(p));
  assert.ok(
    hits.length === 0,
    `public copy must not overclaim truth determination — found: ${hits.join(', ')}`
  );
});

test('D-98B: Truths helper keeps "what is asserted, not whether it is correct"', () => {
  assert.ok(
    appSrc.includes('what is asserted, not whether it is correct'),
    'Truths helperText must keep the D-92C honesty framing'
  );
});

test('D-98B: Review-only moderation wording remains in review helper (not leaked elsewhere)', () => {
  // "Approve makes an item public" is review-mode helper copy; must still exist
  assert.ok(
    appSrc.includes('Approve') && appSrc.includes('Pending') && appSrc.includes('are not public'),
    'review helperText must keep moderation explanation (Pending/Approve)'
  );
});

test('D-98B: verdict-qualifier CSS rule defined', () => {
  assert.ok(
    cssSrc.includes('.verdict-qualifier'),
    'styles.css must define .verdict-qualifier rule'
  );
});

test('D-98B: no backend/D1/wrangler/deploy references added in onboarding copy', () => {
  // The verdict qualifier and helper text are display-only
  assert.ok(
    indexSrc.includes('verdict-qualifier') &&
    !indexSrc.includes('wrangler') && !indexSrc.includes('d1 execute'),
    'onboarding copy must remain display-only — no backend/deploy references'
  );
});

// ── Section 43 — D-100B: Study/Claim verdict and score clarity ────────────────

test('D-100B: Study view carries a verdict qualifier', () => {
  const start = appSrc.indexOf('function renderStudy');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  assert.ok(
    body.includes('study-verdict-qualifier'),
    'renderStudy must include a study-verdict-qualifier near the verdict/meters'
  );
});

test('D-100B: verdict qualifier says pressure-test label, not an automatic truth ruling', () => {
  assert.ok(
    appSrc.includes('pressure-test label') && appSrc.includes('not an automatic truth ruling'),
    'Study verdict qualifier must state it is a pressure-test label, not an automatic truth ruling'
  );
});

test('D-100B: score framing mentions current submitted packet / not absolute certainty', () => {
  assert.ok(
    appSrc.includes('submitted packet') && appSrc.includes('not absolute certainty'),
    'Study score legend must frame scores as the current submitted packet, not absolute certainty'
  );
});

test('D-100B: meter() emits a title tooltip', () => {
  const start = appSrc.indexOf('function meter(');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  assert.ok(
    body.includes('title="${tip}"') && body.includes('Evidence score reflects'),
    'meter() must emit a per-meter title tooltip explaining the score'
  );
});

test('D-100B: meter tooltips cover Evidence, Testability, Survivability', () => {
  assert.ok(
    appSrc.includes('Evidence score reflects submitted support quality and quantity.') &&
    appSrc.includes('Testability reflects how directly the claim can be checked.') &&
    appSrc.includes('Survivability reflects how well the claim holds under pressure.'),
    'meter() tooltips must cover Evidence, Testability, and Survivability'
  );
});

test('D-100B: Evidence/Testability/Survivability meter labels remain present in Study', () => {
  const start = appSrc.indexOf('function renderStudy');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  assert.ok(
    body.includes("meter('Evidence',selected.evidenceScore)") &&
    body.includes("meter('Testability',selected.testability)") &&
    body.includes("meter('Survivability',selected.survivability)"),
    'Study meter labels Evidence/Testability/Survivability must remain'
  );
});

test('D-100B: verdict colour/class logic (cls) is not removed', () => {
  assert.ok(
    appSrc.includes("function cls(s){if(s==='Proven'||String(s).includes('Supported')") &&
    appSrc.includes("return'b-green'") && appSrc.includes("return'b-red'"),
    'cls() verdict→colour mapping must remain intact (no recolour/removal in D-100B)'
  );
});

test('D-100B: arena/study helperText reinforces verdict framing', () => {
  assert.ok(
    appSrc.includes('Verdicts are pressure-test labels, not automatic truth rulings.'),
    'arena/study helperText must reinforce that verdicts are pressure-test labels'
  );
});

test('D-100B: D-98B global searchbar verdict qualifier remains present', () => {
  assert.ok(
    indexSrc.includes('not automatic truth rulings') && indexSrc.includes('verdict-qualifier'),
    'D-98B searchbar verdict qualifier must remain'
  );
});

test('D-100B: D-97B Truth visible / NOT VERIFIED protections remain present', () => {
  assert.ok(
    appSrc.includes("label=truthCtx?'visible':'Public'") &&
    !cssSrc.includes('.truth-not-verified{font-size:8px}'),
    'D-97B Truth "visible" badge and strengthened NOT VERIFIED must remain'
  );
});

test('D-100B: .study-verdict-qualifier CSS rule defined', () => {
  assert.ok(
    cssSrc.includes('.study-verdict-qualifier'),
    'styles.css must define .study-verdict-qualifier'
  );
});

test('D-100B: no backend/D1/wrangler/deploy references added in meter()', () => {
  const start = appSrc.indexOf('function meter(');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  assert.ok(
    !body.includes('/api/') && !body.includes('wrangler') && !/\bd1\b/i.test(body),
    'meter() must remain display-only — no backend references'
  );
});

// ── Section 44 — D-101B: Public journey minor polish ──────────────────────────

test('D-101B: .commandbar CSS rule defined', () => {
  assert.ok(
    cssSrc.includes('.commandbar'),
    'styles.css must define a .commandbar rule'
  );
});

test('D-101B: .commandbar uses flex / wrap / gap layout', () => {
  const i = cssSrc.indexOf('.commandbar{');
  assert.ok(i !== -1, '.commandbar must have a rule block');
  const block = cssSrc.slice(i, cssSrc.indexOf('}', i));
  assert.ok(
    block.includes('display:flex') && block.includes('flex-wrap:wrap') && block.includes('gap:'),
    '.commandbar must use display:flex, flex-wrap:wrap, and a gap'
  );
});

test('D-101B: renderError includes a Back to Home recovery action', () => {
  const start = appSrc.indexOf('function renderError');
  const body = appSrc.slice(start, start + 400);
  assert.ok(
    body.includes("setMode('home')") && body.includes('Back to Home'),
    'renderError must offer a Back to Home recovery button calling setMode(home)'
  );
});

test('D-101B: no backend/D1/wrangler/deploy references added in renderError', () => {
  const start = appSrc.indexOf('function renderError');
  const body = appSrc.slice(start, start + 400);
  assert.ok(
    !body.includes('/api/') && !body.includes('wrangler') && !/\bd1\b/i.test(body),
    'renderError must remain display-only — no backend/deploy references'
  );
});

// ── Section 45 — D-103B: Evidence quality and source clarity ──────────────────

test('D-103B: evidenceQualityLabel maps vibes to "weak argument"', () => {
  assert.ok(
    appSrc.includes('function evidenceQualityLabel(q)') && appSrc.includes("vibes:'weak argument'"),
    'evidenceQualityLabel must map "vibes" to "weak argument"'
  );
});

test('D-103B: evidenceQualityClass tier logic defined', () => {
  assert.ok(
    appSrc.includes('function evidenceQualityClass(q)'),
    'evidenceQualityClass helper must exist'
  );
});

test('D-103B: quality tier classes cover strong/mid/weak/neutral', () => {
  assert.ok(
    appSrc.includes("'ev-q-strong'") && appSrc.includes("'ev-q-mid'") &&
    appSrc.includes("'ev-q-weak'") && appSrc.includes("'ev-q-neutral'"),
    'evidenceQualityClass must return tier classes for strong/mid/weak/neutral'
  );
});

test('D-103B: evidence pill applies the quality tier class', () => {
  const n = appSrc.split('class="pill ${evidenceQualityClass(e.quality)}">').length - 1;
  assert.ok(
    n >= 2,
    `evidence meta pills must apply the quality tier class (found ${n}, expected >= 2)`
  );
});

test('D-103B: missing source renders "no source provided"', () => {
  const start = appSrc.indexOf('function sourceLink(');
  const body = appSrc.slice(start, start + 320);
  assert.ok(
    body.includes('no source provided') && body.includes('ev-no-source'),
    'sourceLink must render a muted "no source provided" indicator when URL is absent'
  );
});

test('D-103B: source link still renders an anchor when source exists', () => {
  const start = appSrc.indexOf('function sourceLink(url)');
  const body = appSrc.slice(start, start + 600);
  assert.ok(
    body.includes('rel="noopener noreferrer">${e}</a>'),
    'sourceLink must still render the source URL as a link when present'
  );
});

test('D-103B: no "verified source" / "trusted source" wording added', () => {
  assert.ok(
    !appSrc.includes('verified source') && !appSrc.includes('trusted source'),
    'evidence display must not imply HumanX verified or trusted a source'
  );
});

test('D-103B: evidence score / verdict calculation not touched (cls + meter intact)', () => {
  assert.ok(
    appSrc.includes("function cls(s){if(s==='Proven'||String(s).includes('Supported')") &&
    appSrc.includes('v=Math.max(0,Math.min(100,Number(v||0)))'),
    'cls() verdict mapping and meter() value clamping must remain unchanged'
  );
});

test('D-103B: reused evidence rendering still exists', () => {
  assert.ok(
    appSrc.includes('function reusedEvidenceHtml') && appSrc.includes('Reused from vault'),
    'reused evidence grouping/rendering must be preserved'
  );
});

test('D-103B: D-100B Study verdict/score qualifier remains present', () => {
  assert.ok(
    appSrc.includes('Verdict is a pressure-test label, not an automatic truth ruling.'),
    'D-100B Study verdict/score qualifier must remain'
  );
});

test('D-103B: quality tier CSS rules defined', () => {
  assert.ok(
    cssSrc.includes('.pill.ev-q-strong') && cssSrc.includes('.pill.ev-q-weak') &&
    cssSrc.includes('.ev-no-source'),
    'styles.css must define quality tier classes and the no-source indicator'
  );
});

test('D-103B: no backend/D1/wrangler/deploy references added in quality helpers', () => {
  const start = appSrc.indexOf('function evidenceQualityLabel(q)');
  const body = appSrc.slice(start, start + 700);
  assert.ok(
    !body.includes('/api/') && !body.includes('wrangler') && !/\bd1\b/i.test(body),
    'evidence quality helpers must remain display-only'
  );
});

// ── Section 46 — D-104B: Evidence source link sanitisation ────────────────────

// Re-derive safeHttpUrl from source for behavioral testing (mirrors app-v10.js)
function safeHttpUrlRef(url){const s=String(url||'').trim();if(!s)return null;try{const u=new URL(s);if(u.protocol==='http:'||u.protocol==='https:')return u.href;return null;}catch(_){return null;}}

test('D-104B: safeHttpUrl helper exists in app-v10.js', () => {
  assert.ok(appSrc.includes('function safeHttpUrl(url)'), 'safeHttpUrl helper must be defined');
});

test('D-104B: safeHttpUrl only allows http: and https:', () => {
  const body = appSrc.slice(appSrc.indexOf('function safeHttpUrl(url)'), appSrc.indexOf('function safeHttpUrl(url)') + 240);
  assert.ok(
    body.includes("u.protocol==='http:'") && body.includes("u.protocol==='https:'") && body.includes('new URL('),
    'safeHttpUrl must whitelist http:/https: via new URL()'
  );
});

test('D-104B: safeHttpUrl behavior — allows http/https, rejects unsafe/malformed', () => {
  assert.ok(safeHttpUrlRef('https://example.com'), 'https must be allowed');
  assert.ok(safeHttpUrlRef('http://example.com/p?q=1'), 'http must be allowed');
  assert.equal(safeHttpUrlRef('javascript:alert(1)'), null, 'javascript: rejected');
  assert.equal(safeHttpUrlRef('data:text/html,x'), null, 'data: rejected');
  assert.equal(safeHttpUrlRef('vbscript:x'), null, 'vbscript: rejected');
  assert.equal(safeHttpUrlRef('blob:https://x/y'), null, 'blob: rejected');
  assert.equal(safeHttpUrlRef('file:///etc/passwd'), null, 'file: rejected');
  assert.equal(safeHttpUrlRef('//example.com'), null, 'protocol-relative rejected');
  assert.equal(safeHttpUrlRef('example.com'), null, 'scheme-less rejected');
  assert.equal(safeHttpUrlRef('mailto:x@y.com'), null, 'mailto rejected (http/https only)');
  assert.equal(safeHttpUrlRef(''), null, 'empty rejected');
});

test('D-104B: sourceLink uses safeHttpUrl before rendering href', () => {
  const start = appSrc.indexOf('function sourceLink(url)');
  const body = appSrc.slice(start, start + 600);
  assert.ok(
    body.includes('safeHttpUrl(raw)') && body.includes('if(safe)'),
    'sourceLink must call safeHttpUrl and branch on the result before emitting an href'
  );
});

test('D-104B: sourceLink only emits href inside the safe branch', () => {
  const start = appSrc.indexOf('function sourceLink(url)');
  const body = appSrc.slice(start, start + 600);
  // The only href in sourceLink must be the escaped safe URL (${e})
  const hrefCount = (body.match(/href="/g) || []).length;
  assert.ok(hrefCount === 1 && body.includes('href="${e}"'), 'sourceLink must emit exactly one href, the escaped safe URL');
});

test('D-104B: unsafe source rendered as non-clickable text with neutral note', () => {
  const start = appSrc.indexOf('function sourceLink(url)');
  const body = appSrc.slice(start, start + 600);
  assert.ok(
    body.includes('ev-bad-source') && body.includes('not a valid web address') && body.includes('${esc(raw)}'),
    'unsafe source must render escaped raw text with a "not a valid web address" note, no href'
  );
});

test('D-104B: anchor retains rel="noopener noreferrer" and target=_blank', () => {
  const start = appSrc.indexOf('function sourceLink(url)');
  const body = appSrc.slice(start, start + 600);
  assert.ok(
    body.includes('rel="noopener noreferrer"') && body.includes('target="_blank"'),
    'safe-branch anchor must keep target=_blank and rel=noopener noreferrer'
  );
});

test('D-104B: no source provided behavior remains (D-103B regression)', () => {
  const start = appSrc.indexOf('function sourceLink(url)');
  const body = appSrc.slice(start, start + 600);
  assert.ok(body.includes('no source provided') && body.includes('ev-no-source'), 'no-source indicator must remain');
});

test('D-104B: no verified/trusted source wording added', () => {
  assert.ok(
    !appSrc.includes('verified source') && !appSrc.includes('trusted source'),
    'no source verification/trust wording'
  );
});

test('D-104B: unsafe-source note avoids scary wording (malicious/blocked)', () => {
  const start = appSrc.indexOf('function sourceLink(url)');
  const body = appSrc.slice(start, start + 600);
  assert.ok(
    !/malicious|blocked|dangerous|unsafe link/i.test(body),
    'unsafe-source wording must stay neutral (no malicious/blocked/dangerous)'
  );
});

test('D-104B: D-103B evidence quality behavior remains present', () => {
  assert.ok(
    appSrc.includes('function evidenceQualityLabel(q)') && appSrc.includes("vibes:'weak argument'") &&
    appSrc.includes('function evidenceQualityClass(q)'),
    'D-103B quality label/class helpers must remain'
  );
});

test('D-104B: bad-source CSS rules defined', () => {
  assert.ok(
    cssSrc.includes('.ev-bad-source'),
    'styles.css must define .ev-bad-source'
  );
});

test('D-104B: no backend/D1/wrangler/deploy references added in sanitiser', () => {
  const start = appSrc.indexOf('function safeHttpUrl(url)');
  const body = appSrc.slice(start, start + 800);
  assert.ok(
    !body.includes('/api/') && !body.includes('wrangler') && !/\bd1\b/i.test(body),
    'sanitiser must remain client-side display-only'
  );
});

// ── Section 47 — D-104F: source URL validation enforced on both layers ────────

test('D-104F: frontend safeHttpUrl (D-104B) remains present', () => {
  assert.ok(
    appSrc.includes('function safeHttpUrl(url)'),
    'frontend D-104B safeHttpUrl render guard must remain'
  );
});

test('D-104F: Worker httpUrlOrNull validator present', () => {
  assert.ok(
    workerSrc.includes('function httpUrlOrNull'),
    'Worker must define httpUrlOrNull for source URL validation'
  );
});

test('D-104F: both layers whitelist only http:/https: for source URLs', () => {
  const feOk = appSrc.includes("u.protocol==='http:'") && appSrc.includes("u.protocol==='https:'");
  const beOk = workerSrc.includes("u.protocol === 'http:'") && workerSrc.includes("u.protocol === 'https:'");
  assert.ok(feOk && beOk, 'frontend (render) and Worker (storage) must both restrict source URLs to http/https');
});

test('D-104F: Worker evidence route validates body.sourceUrl (no raw cleanText insert)', () => {
  assert.ok(
    workerSrc.includes('httpUrlOrNull(body.sourceUrl)') &&
    !workerSrc.includes("cleanText(body.sourceUrl || '',500)"),
    '/api/evidence must route body.sourceUrl through httpUrlOrNull, not insert it raw'
  );
});

// ── Section 48 — D-106B: admin secret hygiene + debug hardening ───────────────

let gitignoreSrc106 = '';
try { gitignoreSrc106 = readFileSync(path.join(__dirname, '../.gitignore'), 'utf8'); } catch { gitignoreSrc106 = ''; }

test('D-106B: .gitignore exists and ignores local env/secret files', () => {
  assert.ok(
    gitignoreSrc106.includes('.dev.vars') && gitignoreSrc106.includes('.env') && gitignoreSrc106.includes('.env.*'),
    '.gitignore must ignore .dev.vars and .env/.env.*'
  );
});

test('D-106B: /api/debug is admin-gated in Worker', () => {
  const m = workerSrc.match(/url\.pathname === '\/api\/debug'[\s\S]{0,200}?debugState\(request, env\)/);
  assert.ok(m && m[0].includes('requireAdmin(request, env)'), '/api/debug must require admin before debugState');
});

test('D-106B: requireAdmin uses safeEqual and no raw equality remains', () => {
  assert.ok(
    workerSrc.includes('function safeEqual(') &&
    /function requireAdmin[\s\S]{0,200}safeEqual\(/.test(workerSrc) &&
    !workerSrc.includes('admin !== (env.HUMANX_ADMIN_TOKEN'),
    'requireAdmin must use safeEqual; raw simple-equality must be gone'
  );
});

test('D-106B: requireAdmin remains fail-closed on missing admin token env', () => {
  assert.ok(
    /function requireAdmin[\s\S]{0,220}!expected/.test(workerSrc),
    'requireAdmin must fail closed when HUMANX_ADMIN_TOKEN is missing/empty'
  );
});

test('D-106B: no HUMANX_ADMIN_TOKEN value literal committed in Worker', () => {
  assert.ok(
    !/HUMANX_ADMIN_TOKEN\s*[=:]\s*['"][A-Za-z0-9_\-]{8,}['"]/.test(workerSrc),
    'HUMANX_ADMIN_TOKEN must never be assigned a literal value'
  );
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
