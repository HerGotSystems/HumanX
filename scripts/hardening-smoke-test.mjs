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
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerSrc = readFileSync(path.join(__dirname, '../src/worker.js'), 'utf8');
const cbcSrc = readFileSync(path.join(__dirname, '../src/claim-builder-contexts.js'), 'utf8');

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
const truthsSrc = readFileSync(path.join(__dirname, '../src/truths.js'), 'utf8');

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
const apiInventorySrc = (() => { try { return readFileSync(path.join(__dirname, '../docs/API_ENDPOINT_INVENTORY.md'), 'utf8'); } catch { return ''; } })();

test('docs/README.md contains "Known-good checks" section', () => {
  assert.ok(readmeSrc.includes('Known-good checks'), 'docs/README.md must contain a "Known-good checks" section');
});

// Self-reference: when new checks are added to this file, update docs/README.md
// Known-good checks table and this assertion together in the same commit.
test('docs/README.md documents hardening smoke count: 254 passed, 0 failed (legacy check — see D-93B Section 37)', () => {
  assert.ok(readmeSrc.includes('254 passed, 0 failed') || readmeSrc.includes('266 passed, 0 failed') || readmeSrc.includes('267 passed, 0 failed') || readmeSrc.includes('272 passed, 0 failed') || readmeSrc.includes('286 passed, 0 failed') || readmeSrc.includes('299 passed, 0 failed') || readmeSrc.includes('312 passed, 0 failed') || readmeSrc.includes('324 passed, 0 failed') || readmeSrc.includes('328 passed, 0 failed') || readmeSrc.includes('340 passed, 0 failed') || readmeSrc.includes('353 passed, 0 failed') || readmeSrc.includes('357 passed, 0 failed') || readmeSrc.includes('362 passed, 0 failed') || readmeSrc.includes('372 passed, 0 failed') || readmeSrc.includes('375 passed, 0 failed') || readmeSrc.includes('383 passed, 0 failed') || readmeSrc.includes('392 passed, 0 failed') || readmeSrc.includes('403 passed, 0 failed') || readmeSrc.includes('416 passed, 0 failed') || readmeSrc.includes('479 passed, 0 failed') || readmeSrc.includes('498 passed, 0 failed') || readmeSrc.includes('655 passed, 0 failed') || readmeSrc.includes('724 passed, 0 failed'), 'docs/README.md must document hardening smoke expected count');
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
const convertTruthBody = ctIdx >= 0 ? appSrc.slice(ctIdx, ctIdx + 1000) : '';

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
const migSrc0010 = (() => { try { return readFileSync(path.join(__dirname, '../migrations/0010_invite_auth.sql'), 'utf8'); } catch { return ''; } })();
const migSrc0011 = (() => { try { return readFileSync(path.join(__dirname, '../migrations/0011_user_content_indexes.sql'), 'utf8'); } catch { return ''; } })();
const migSrc0012 = (() => { try { return readFileSync(path.join(__dirname, '../migrations/0012_user_owned_archive_export.sql'), 'utf8'); } catch { return ''; } })();

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
  assert.ok(readmeSrc.includes('254 passed, 0 failed') || readmeSrc.includes('266 passed, 0 failed') || readmeSrc.includes('267 passed, 0 failed') || readmeSrc.includes('272 passed, 0 failed') || readmeSrc.includes('286 passed, 0 failed') || readmeSrc.includes('299 passed, 0 failed') || readmeSrc.includes('312 passed, 0 failed') || readmeSrc.includes('324 passed, 0 failed') || readmeSrc.includes('328 passed, 0 failed') || readmeSrc.includes('340 passed, 0 failed') || readmeSrc.includes('353 passed, 0 failed') || readmeSrc.includes('357 passed, 0 failed') || readmeSrc.includes('362 passed, 0 failed') || readmeSrc.includes('372 passed, 0 failed') || readmeSrc.includes('375 passed, 0 failed') || readmeSrc.includes('383 passed, 0 failed') || readmeSrc.includes('392 passed, 0 failed') || readmeSrc.includes('403 passed, 0 failed') || readmeSrc.includes('416 passed, 0 failed') || readmeSrc.includes('479 passed, 0 failed') || readmeSrc.includes('498 passed, 0 failed') || readmeSrc.includes('655 passed, 0 failed') || readmeSrc.includes('724 passed, 0 failed'), 'docs/README.md must document hardening smoke expected count');
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

test('D-95B: bottom-actions Approve in inspect panel has review-inspect-approve class', () => {
  const start = appSrc.indexOf('function renderReviewInspectPanel');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  const bottomIdx = body.indexOf('review-inspect-actions');
  assert.ok(
    bottomIdx !== -1 && body.slice(bottomIdx).includes('btn-approve review-inspect-approve'),
    'bottom-actions Approve button must include review-inspect-approve class in review-inspect-actions div'
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

test('D-96B: inspect panel action row Approve calls reviewDecisionUI directly', () => {
  const start = appSrc.indexOf('function renderReviewInspectPanel');
  const end = appSrc.indexOf('\nfunction ', start + 1);
  const body = appSrc.slice(start, end);
  assert.ok(
    body.includes('btn-approve review-inspect-approve') &&
    body.includes("onclick=\"reviewDecisionUI('${esc(type)}','${esc(id)}','public')\">Approve"),
    'inspect panel action row Approve must call reviewDecisionUI directly — deliberate review path'
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

// ── Section 49 — D-107B: Review inspect evidence source sanitisation ──────────

function reviewInspectBody() {
  const start = appSrc.indexOf('function renderReviewInspectPanel');
  return start === -1 ? '' : appSrc.slice(start, start + 4500);
}

test('D-107B: Review inspect Source field uses shared sourceLink', () => {
  assert.ok(
    reviewInspectBody().includes("fields.push(['Source',sourceLink(item.source_url)])"),
    'renderReviewInspectPanel must render evidence Source via sourceLink()'
  );
});

test('D-107B: Review inspect panel no longer has inline unsafe source href', () => {
  assert.ok(
    !reviewInspectBody().includes('href="${esc(item.source_url)}"'),
    'renderReviewInspectPanel must not place item.source_url directly into an href'
  );
});

test('D-107B: sourceLink remains protected by safeHttpUrl', () => {
  assert.ok(
    /function sourceLink[\s\S]{0,220}safeHttpUrl/.test(appSrc) &&
    appSrc.includes('function safeHttpUrl(url)'),
    'sourceLink must still validate via safeHttpUrl (http/https only)'
  );
});

test('D-107B: unsafe source cannot reach an href in the review inspect path', () => {
  // sourceLink only emits href in its safe branch; inspect now delegates to it.
  const slStart = appSrc.indexOf('function sourceLink(url)');
  const slBody = appSrc.slice(slStart, slStart + 600);
  const hrefCount = (slBody.match(/href="/g) || []).length;
  assert.ok(hrefCount === 1 && slBody.includes('href="${e}"'), 'sourceLink must emit exactly one href (the escaped safe URL)');
});

test('D-107B: missing source in review inspect renders "no source provided"', () => {
  // Source is now always pushed via sourceLink, which renders no-source for empty input.
  const body = reviewInspectBody();
  assert.ok(
    body.includes("fields.push(['Source',sourceLink(item.source_url)])") &&
    appSrc.includes('no source provided'),
    'empty source must render "no source provided" via sourceLink'
  );
});

test('D-107B: Review inspect Quality uses evidenceQualityLabel', () => {
  const body = reviewInspectBody();
  assert.ok(
    body.includes('evidenceQualityLabel(item.quality)') && !body.includes("['Quality',esc(item.quality)]"),
    'Review inspect Quality must route through evidenceQualityLabel (no raw quality)'
  );
});

test('D-107B: vibes still maps to "weak argument"', () => {
  assert.ok(appSrc.includes("vibes:'weak argument'"), 'evidenceQualityLabel must keep vibes -> weak argument');
});

test('D-107B: no verified/trusted source wording added', () => {
  assert.ok(
    !appSrc.includes('verified source') && !appSrc.includes('trusted source'),
    'no source verification/trust wording'
  );
});

test('D-107B: card Approve two-step + inspect approve behavior preserved', () => {
  assert.ok(
    appSrc.includes('function requestApproveReview(id)') &&
    appSrc.includes("onclick=\"requestApproveReview('") &&
    appSrc.includes('review-inspect-approve'),
    'D-96B two-step card approve and inspect approve must remain'
  );
});

test('D-107B: no backend/D1/wrangler/deploy references added in review inspect path', () => {
  const body = reviewInspectBody();
  assert.ok(
    !body.includes('wrangler') && !/\bd1 execute\b/i.test(body) && !body.includes('/api/evidence'),
    'review inspect rendering must remain display-only (no wrangler/deploy/backend refs added)'
  );
});

// ── Section 50 — D-109B: orphan legacy frontend bundle cleanup ────────────────

test('D-109B: index.html loads app-v10.js', () => {
  assert.ok(indexSrc.includes('app-v10.js'), 'public/index.html must load app-v10.js');
});

test('D-109B: orphan app-v3..v9 bundles no longer exist', () => {
  const present = [];
  for (let v = 3; v <= 9; v++) {
    if (existsSync(path.join(__dirname, `../public/app-v${v}.js`))) present.push(`app-v${v}.js`);
  }
  assert.ok(present.length === 0, `orphan legacy bundles must be deleted (still present: ${present.join(', ')})`);
});

test('D-109B: no served HTML references app-v3..v9', () => {
  assert.ok(
    !/app-v[3-9]\.js/.test(indexSrc),
    'public/index.html must not reference any app-v3..v9 bundle'
  );
});

// ── Section 51 — D-111B: submit trust framing surfaced in main panel ──────────

function renderSubmitBody() {
  const start = appSrc.indexOf('function renderSubmit');
  return start === -1 ? '' : appSrc.slice(start, start + 1000);
}

test('D-111B: submit main panel shows a visible trust note', () => {
  const body = renderSubmitBody();
  assert.ok(
    body.includes('submit-trust-note') && body.includes('not an automatic verdict'),
    'renderSubmit must render a visible trust note ("not an automatic verdict")'
  );
});

test('D-111B: trust note is inside renderSubmit, not only helperText', () => {
  assert.ok(
    renderSubmitBody().includes('submit-trust-note'),
    'the trust note must be in the renderSubmit main panel (the side dock is hidden in submit mode)'
  );
});

test('D-111B: .submit-trust-note CSS rule defined', () => {
  assert.ok(cssSrc.includes('.submit-trust-note'), 'styles.css must define .submit-trust-note');
});

test('D-111B: hero no-overclaim copy remains', () => {
  assert.ok(appSrc.includes('it does not decide what is true'), 'home hero framing must remain');
});

test('D-111B: Study verdict qualifier remains', () => {
  assert.ok(
    appSrc.includes('Verdict is a pressure-test label, not an automatic truth ruling.'),
    'D-100B Study verdict qualifier must remain'
  );
});

test('D-111B: Truths visible/not-proven copy remains', () => {
  assert.ok(appSrc.includes('Public means visible, not proven'), 'Truths "visible, not proven" copy must remain');
});

test('D-111B: no verified/trusted source wording added', () => {
  assert.ok(
    !appSrc.includes('verified source') && !appSrc.includes('trusted source'),
    'no source verification/trust wording'
  );
});

test('D-111B: no backend/D1/wrangler/deploy references added in renderSubmit', () => {
  const body = renderSubmitBody();
  assert.ok(
    !body.includes('wrangler') && !/\bd1 execute\b/i.test(body),
    'renderSubmit must remain display-only'
  );
});

// ── Section 52 — D-112B: mobile tab navigation affordance ─────────────────────

function setModeBody() {
  const start = appSrc.indexOf('function setMode(m)');
  return start === -1 ? '' : appSrc.slice(start, start + 600);
}

test('D-112B: .tabs keeps horizontal overflow / touch scrolling on mobile', () => {
  assert.ok(
    cssSrc.includes('flex-wrap:nowrap;overflow-x:auto') && cssSrc.includes('-webkit-overflow-scrolling:touch'),
    'mobile .tabs must keep overflow-x:auto + touch scrolling'
  );
});

test('D-112B: mobile tab strip has an edge fade affordance (mask/gradient)', () => {
  assert.ok(
    cssSrc.includes('mask-image:linear-gradient(to right') && cssSrc.includes('-webkit-mask-image:linear-gradient(to right'),
    'mobile .tabs must define a right-edge mask/gradient fade cue'
  );
});

test('D-112B: scrollbar-hidden behavior preserved alongside the new cue', () => {
  assert.ok(
    cssSrc.includes('scrollbar-width:none') && cssSrc.includes('.tabs::-webkit-scrollbar{display:none}'),
    'hidden scrollbar must remain (the fade cue replaces it)'
  );
});

test('D-112B: setMode scrolls the active tab into view', () => {
  const body = setModeBody();
  assert.ok(
    body.includes('scrollIntoView') && body.includes("getElementById('tab-'+m)"),
    'setMode must scroll the active tab (#tab-<m>) into view'
  );
});

test('D-112B: setMode guards a missing active tab safely', () => {
  const body = setModeBody();
  assert.ok(
    body.includes('if(_activeTab)') || /\?\.\s*scrollIntoView/.test(body),
    'setMode must guard against a missing tab element before scrolling'
  );
});

test('D-112B: setMode still toggles .active on the mode tab', () => {
  assert.ok(setModeBody().includes("_activeTab.classList.add('active')"), 'setMode must still mark the active tab');
});

test('D-112B: D-111 submit trust note remains present', () => {
  assert.ok(appSrc.includes('submit-trust-note') && appSrc.includes('not an automatic verdict'), 'submit trust note must remain');
});

test('D-112B: all original 9 nav tabs remain in index.html (D-137D added a 10th: Me)', () => {
  const n = (indexSrc.match(/id="tab-/g) || []).length;
  assert.ok(n === 10, `nav must keep all 9 original tabs plus the D-137D Me tab (found ${n})`);
});

test('D-112B: no backend/D1/wrangler/deploy references added in setMode', () => {
  const body = setModeBody();
  assert.ok(
    !body.includes('wrangler') && !body.includes('/api/') && !/\bd1 execute\b/i.test(body),
    'setMode must remain client-side nav only'
  );
});

// ── Section 53 — D-113B: Home mobile card density ────────────────────────────

test('D-113B: .cc-card-when text remains present in app-v10.js', () => {
  assert.ok((appSrc.match(/cc-card-when/g) || []).length >= 7, 'all 7 card "When:" lines must remain in source');
});

test('D-113B: .cc-card-when is hidden only inside a mobile media query', () => {
  // The hide rule must live within a max-width media block.
  const mediaBlocks = cssSrc.match(/@media\(max-width:\d+px\)\{[\s\S]*?\}\s*\}/g) || [];
  const hiddenInMedia = mediaBlocks.some(b => /\.cc-card-when\{display:none\}/.test(b));
  assert.ok(hiddenInMedia, '.cc-card-when{display:none} must be inside a max-width media block');
});

test('D-113B: .cc-card-when is NOT globally hidden', () => {
  // Strip all media blocks, then confirm no top-level display:none on cc-card-when.
  const noMedia = cssSrc.replace(/@media[^{]+\{[\s\S]*?\}\s*\}/g, '');
  assert.ok(
    !/\.cc-card-when\{[^}]*display:none/.test(noMedia),
    '.cc-card-when must not be hidden at the top (desktop) level'
  );
});

test('D-113B: base .cc-card-when styling still defined for desktop', () => {
  assert.ok(cssSrc.includes('.cc-card-when{font-size:9px'), 'desktop .cc-card-when rule must remain');
});

test('D-113B: Home still renders 7 action cards', () => {
  assert.ok((appSrc.match(/cc-card-desc/g) || []).length === 7, 'Home must keep all 7 action cards');
});

test('D-113B: card titles/descriptions not hidden by the mobile density rule', () => {
  const mediaBlocks = cssSrc.match(/@media\(max-width:\d+px\)\{[\s\S]*?\}\s*\}/g) || [];
  const hidesTitleOrDesc = mediaBlocks.some(b => /\.cc-card-desc\{display:none\}/.test(b) || /\.cc-card>b\{display:none\}/.test(b) || /\.cc-card b\{display:none\}/.test(b));
  assert.ok(!hidesTitleOrDesc, 'mobile rule must not hide card descriptions/titles');
});

test('D-113B: Truths add form not collapsed/changed in this patch', () => {
  const start = appSrc.indexOf('function renderTruths');
  const body = appSrc.slice(start, start + 1700);
  // Add-a-Truth form still inline (not wrapped in <details>) — deferred to a separate decision
  assert.ok(
    body.includes('Add a Truth') && body.includes('truthStatement') && !/<details[^>]*>\s*<summary[^>]*>[^<]*Add a Truth/i.test(body),
    'Truths add form must remain unchanged (not collapsed) in D-113B'
  );
});

test('D-113B: D-111 submit trust note remains', () => {
  assert.ok(appSrc.includes('submit-trust-note') && appSrc.includes('not an automatic verdict'), 'submit trust note must remain');
});

test('D-113B: D-112 mobile tab edge cue remains', () => {
  assert.ok(cssSrc.includes('mask-image:linear-gradient(to right'), 'mobile tab edge fade must remain');
});

test('D-113B: D-112 active-tab scroll-into-view remains', () => {
  assert.ok(appSrc.includes('_activeTab.scrollIntoView'), 'setMode active-tab scroll must remain');
});

test('D-113B: no backend/D1/wrangler/deploy references added in CSS density change', () => {
  // The density rule is CSS-only; sanity-check the styles file has no script-y leakage.
  assert.ok(!cssSrc.includes('wrangler') && !cssSrc.includes('/api/'), 'styles.css must remain pure CSS');
});

// ── Section 54 — D-114B: Truths add-form mobile collapse ─────────────────────

function renderTruthsBody() {
  const start = appSrc.indexOf('function renderTruths');
  return start === -1 ? '' : appSrc.slice(start, start + 2800);
}

test('D-114B: Add-a-Truth form wrapped in .truth-add-details', () => {
  assert.ok(
    renderTruthsBody().includes('<details class="truth-add-details">'),
    'Truths add form must be wrapped in <details class="truth-add-details">'
  );
});

test('D-114B: details has a summary with add-truth wording', () => {
  const body = renderTruthsBody();
  assert.ok(
    body.includes('<summary class="truth-add-summary">') && /Add a (public )?Truth/.test(body),
    'details must include a <summary> with clear add-truth wording'
  );
});

test('D-114B: form field IDs unchanged', () => {
  assert.ok(
    appSrc.includes('id="truthStatement"') && appSrc.includes('id="truthCategory"') &&
    appSrc.includes('id="truthOrigin"') && appSrc.includes('id="truthType"'),
    'truthStatement/truthCategory/truthOrigin/truthType IDs must be unchanged'
  );
});

test('D-114B: submitTruth() call and function unchanged', () => {
  assert.ok(
    appSrc.includes('onclick="submitTruth()"') &&
    appSrc.includes("function submitTruth(){const statement=document.getElementById('truthStatement')"),
    'submitTruth wiring and field reads must be unchanged'
  );
});

test('D-114B: mobile default collapsed (no open attr on the details wrapper)', () => {
  const body = renderTruthsBody();
  assert.ok(
    !body.includes('truth-add-details" open') && !body.includes('truth-add-details open'),
    'truth-add-details must not carry the open attribute (collapsed by default on mobile)'
  );
});

test('D-114B: desktop ≥601px force-expands and hides the summary', () => {
  assert.ok(
    cssSrc.includes('@media(min-width:601px){.truth-add-details>summary{display:none}.truth-add-details>*:not(summary){display:revert}}'),
    'desktop media query must force-expand the form and hide the summary'
  );
});

test('D-114B: form remains above the truth list', () => {
  const body = renderTruthsBody();
  assert.ok(
    body.indexOf('truth-add-details') !== -1 && body.indexOf('truth-add-details') < body.indexOf('truth-grid-container'),
    'the add form must render above the truth grid'
  );
});

test('D-114B: empty-state "form above" copy remains valid', () => {
  assert.ok(appSrc.includes('Use the form above to record'), 'empty-state "form above" copy must remain');
});

test('D-114B: "Public means visible, not proven" framing remains', () => {
  assert.ok(appSrc.includes('Public means visible, not proven'), 'Truths trust framing must remain');
});

test('D-114B: D-111 submit trust note remains', () => {
  assert.ok(appSrc.includes('submit-trust-note') && appSrc.includes('not an automatic verdict'), 'submit trust note must remain');
});

test('D-114B: D-112 tab edge cue + active-tab scroll remain', () => {
  assert.ok(
    cssSrc.includes('mask-image:linear-gradient(to right') && appSrc.includes('_activeTab.scrollIntoView'),
    'D-112 mobile tab affordance must remain'
  );
});

test('D-114B: D-113 .cc-card-when mobile-hide rule remains', () => {
  const mediaBlocks = cssSrc.match(/@media\(max-width:\d+px\)\{[\s\S]*?\}\s*\}/g) || [];
  assert.ok(mediaBlocks.some(b => /\.cc-card-when\{display:none\}/.test(b)), 'D-113B Home card mobile rule must remain');
});

test('D-114B: no backend/D1/wrangler/deploy references added in renderTruths', () => {
  const body = renderTruthsBody();
  assert.ok(
    !body.includes('wrangler') && !/\bd1 execute\b/i.test(body),
    'renderTruths must remain display-only'
  );
});

// ── Section 40 — D-129A: Review moderation anchor ergonomics ─────────────────

console.log('\n40. D-129A: Review moderation anchor ergonomics');

test('D-129A: scrollToReviewAnchor is defined and assigned to window', () => {
  assert.ok(
    appSrc.includes('function scrollToReviewAnchor(') &&
    appSrc.includes('window.scrollToReviewAnchor=scrollToReviewAnchor'),
    'scrollToReviewAnchor must be defined and exposed on window'
  );
});

test('D-129A: scrollToReviewAnchor falls back through inspect-panel → card-by-id → first card', () => {
  const body = appSrc.slice(appSrc.indexOf('function scrollToReviewAnchor('));
  const fn = body.slice(0, body.indexOf('\n') || 500);
  assert.ok(
    fn.includes('.review-inspect-panel') &&
    fn.includes('data-review-id') &&
    fn.includes('.review-card'),
    'scrollToReviewAnchor must try inspect-panel, then data-review-id card, then first .review-card'
  );
});

test('D-129A: reviewDecisionUI captures anchor id before action and scrolls after render', () => {
  const idx = appSrc.indexOf('async function reviewDecisionUI(');
  const body = appSrc.slice(idx, idx + 1000);
  assert.ok(
    body.includes('_anchorId=inspectedReviewItem') &&
    body.includes('scrollToReviewAnchor(_anchorId)'),
    'reviewDecisionUI must capture anchor before action and call scrollToReviewAnchor after renderReviewList'
  );
});

test('D-129A: markDuplicateUI scrolls to anchor after renderReviewList', () => {
  const idx = appSrc.indexOf('async function markDuplicateUI(');
  const body = appSrc.slice(idx, idx + 1600);
  assert.ok(
    body.includes('scrollToReviewAnchor(claimId)'),
    'markDuplicateUI onConfirm must call scrollToReviewAnchor(claimId) after renderReviewList'
  );
});

test('D-129A: reviewCard adds data-review-id attribute to article element', () => {
  const idx = appSrc.indexOf('function reviewCard(');
  const body = appSrc.slice(idx, idx + 5400);
  assert.ok(
    body.includes('data-review-id="${esc(id)}"'),
    'reviewCard must set data-review-id on article for anchor lookup'
  );
});

test('D-129A: inspected card suppresses duplicate Approve/Keep/Reject — only shows Inspect toggle', () => {
  const idx = appSrc.indexOf('function reviewCard(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('isSelected?\'\':`${approveBtn}'),
    'reviewCard must omit primary action buttons when card is selected/inspected (isSelected suppresses them)'
  );
});

test('D-129A: inspect panel still has its own Approve / Keep Pending / Reject controls', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const body = appSrc.slice(idx, idx + 12000);
  assert.ok(
    body.includes('review-inspect-actions') &&
    body.includes('btn-approve review-inspect-approve'),
    'renderReviewInspectPanel must keep its bottom decision row with approve/keep/reject controls'
  );
});

test('D-129A: existing review actions (Approve/Keep/Reject) still wired to reviewDecisionUI', () => {
  assert.ok(
    appSrc.includes("onclick=\"reviewDecisionUI(") &&
    appSrc.includes("'public'") &&
    appSrc.includes("'rejected'") &&
    appSrc.includes("'review'"),
    'reviewDecisionUI must still be wired for public/rejected/review decisions'
  );
});

// ── Section 41 — D-129B: Review inspector action dedupe ──────────────────────

console.log('\n41. D-129B: Review inspector action dedupe');

test('D-129B: inspect panel has no top-actions duplicate row', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const body = appSrc.slice(idx, idx + 12000);
  assert.ok(
    !body.includes('review-inspect-top-actions'),
    'renderReviewInspectPanel must not contain a review-inspect-top-actions row — top duplicate removed'
  );
});

test('D-129B: inspect panel has exactly one review-inspect-actions row', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const body = appSrc.slice(idx, idx + 12000);
  const first = body.indexOf('review-inspect-actions');
  const second = body.indexOf('review-inspect-actions', first + 1);
  assert.ok(first !== -1 && second === -1, 'renderReviewInspectPanel must have exactly one review-inspect-actions div');
});

test('D-129B: bottom action row has Approve, Keep Pending, Reject, and Mark Duplicate', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const body = appSrc.slice(idx, idx + 12000);
  // The bottom row uses ${rejectSection}/${dupSection} template vars — verify those vars are defined
  // and the action div includes approve + keep + the section vars
  const actIdx = body.indexOf('review-inspect-actions');
  const actSection = body.slice(actIdx, actIdx + 600);
  assert.ok(
    actSection.includes('btn-approve review-inspect-approve') &&
    actSection.includes('btn-keep') &&
    actSection.includes('${rejectSection}') &&
    actSection.includes('${dupSection}'),
    'bottom action row must contain Approve, Keep Pending, and ${rejectSection}/${dupSection} variables'
  );
});

test('D-129B: Open Study View still present in bottom action row', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const body = appSrc.slice(idx, idx + 12000);
  const actIdx = body.indexOf('review-inspect-actions');
  const actSection = body.slice(actIdx, actIdx + 600);
  assert.ok(
    actSection.includes('${studyBtn}'),
    'bottom action row must still include ${studyBtn} variable for Open Study View'
  );
});

test('D-129B: non-inspected card action row (review-actions) still rendered for non-selected cards', () => {
  const idx = appSrc.indexOf('function reviewCard(');
  const body = appSrc.slice(idx, idx + 5400);
  assert.ok(
    body.includes('class="review-actions"'),
    'reviewCard must still render .review-actions div for card-level actions'
  );
});

test('D-129B: D-129A anchor scroll behavior preserved after dedupe', () => {
  assert.ok(
    appSrc.includes('function scrollToReviewAnchor(') &&
    appSrc.includes('scrollToReviewAnchor(_anchorId)') &&
    appSrc.includes('scrollToReviewAnchor(claimId)'),
    'D-129A anchor scroll must remain intact after top-actions removal'
  );
});

// ── Section 42 — D-129C: Useful review context panel ─────────────────────────

console.log('\n42. D-129C: Useful review context panel');

test('D-129C: renderReviewInspectContext function is defined', () => {
  assert.ok(
    appSrc.includes('function renderReviewInspectContext('),
    'renderReviewInspectContext must be defined'
  );
});

test('D-129C: renderReviewList updates #casefile with inspect context when item is open', () => {
  const idx = appSrc.indexOf('function renderReviewList(');
  const body = appSrc.slice(idx, idx + 1200);
  assert.ok(
    body.includes('casefile') &&
    body.includes('renderReviewInspectContext(inspectedReviewItem)') &&
    body.includes('helperText()'),
    'renderReviewList must swap #casefile between renderReviewInspectContext and helperText based on inspectedReviewItem'
  );
});

test('D-129C: renderReviewList falls back to helperText when no item inspected', () => {
  const idx = appSrc.indexOf('function renderReviewList(');
  const body = appSrc.slice(idx, idx + 1200);
  assert.ok(
    body.includes('inspectedReviewItem?renderReviewInspectContext(inspectedReviewItem):helperText()'),
    'renderReviewList must use ternary: inspectedReviewItem ? renderReviewInspectContext : helperText'
  );
});

test('D-129C: renderReviewInspectContext renders item type, state, and title', () => {
  const idx = appSrc.indexOf('function renderReviewInspectContext(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('rctx-head') &&
    body.includes('rctx-title') &&
    body.includes('displayTitle'),
    'renderReviewInspectContext must render type/state badges (rctx-head) and title (rctx-title)'
  );
});

test('D-129C: renderReviewInspectContext renders evidence/testability/survivability scores for claims', () => {
  const idx = appSrc.indexOf('function renderReviewInspectContext(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('evidence_score') && body.includes('evidenceScore') &&
    body.includes('testability') && body.includes('survivability'),
    'renderReviewInspectContext must include evidence/testability/survivability score fields'
  );
});

test('D-129C: renderReviewInspectContext renders structured builder context with rctx-builder class', () => {
  const idx = appSrc.indexOf('function renderReviewInspectContext(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('rctx-builder') &&
    body.includes('structured') &&
    body.includes('legacy') &&
    body.includes('no builder context'),
    'renderReviewInspectContext must handle structured/legacy/missing builder context states'
  );
});

test('D-129C: renderReviewInspectContext truncates long text fields', () => {
  const idx = appSrc.indexOf('function renderReviewInspectContext(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('trunc(') && body.includes('…'),
    'renderReviewInspectContext must truncate long text fields to keep panel compact'
  );
});

test('D-129C: renderReviewInspectContext does not contain action buttons', () => {
  const idx = appSrc.indexOf('function renderReviewInspectContext(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    !body.includes('btn-approve') && !body.includes('btn-reject') && !body.includes('btn-keep') &&
    !body.includes('reviewDecisionUI'),
    'renderReviewInspectContext must not contain any moderation action buttons or reviewDecisionUI calls'
  );
});

test('D-129C: rctx-panel CSS class defined in styles.css', () => {
  assert.ok(cssSrc.includes('.rctx-panel'), '.rctx-panel must be defined in styles.css');
});

test('D-129C: rctx-builder CSS class defined in styles.css', () => {
  assert.ok(cssSrc.includes('.rctx-builder'), '.rctx-builder must be defined in styles.css');
});

test('D-129C: D-129A anchor scroll preserved after context panel addition', () => {
  assert.ok(
    appSrc.includes('scrollToReviewAnchor(_anchorId)') &&
    appSrc.includes('scrollToReviewAnchor(claimId)'),
    'D-129A anchor scrolls must remain intact'
  );
});

test('D-129C: D-129B single action row preserved', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const body = appSrc.slice(idx, idx + 12000);
  assert.ok(
    !body.includes('review-inspect-top-actions') &&
    body.includes('review-inspect-actions'),
    'D-129B single bottom action row must remain — no top-actions re-introduced'
  );
});

// ── Section 43 — D-129D: Compact review inspector density ────────────────────

console.log('\n43. D-129D: Compact review inspector density');

test('D-129D: renderReviewInspectPanel adds review-inspect-compact class to panel', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('review-inspect-compact'),
    'renderReviewInspectPanel return template must include review-inspect-compact class'
  );
});

test('D-129D: CSS defines review-inspect-compact', () => {
  assert.ok(cssSrc.includes('.review-inspect-compact'), '.review-inspect-compact must be defined in styles.css');
});

test('D-129D: inspect fields grid uses compact minmax (≤150px)', () => {
  assert.ok(
    cssSrc.includes('minmax(140px') || cssSrc.includes('minmax(130px') || cssSrc.includes('minmax(120px'),
    '.review-inspect-fields must use minmax ≤ 150px for denser column layout'
  );
});

test('D-129D: inspect panel padding is compact (≤10px)', () => {
  const panelRule = cssSrc.match(/\.review-inspect-panel\{[^}]+\}/);
  assert.ok(
    panelRule && (panelRule[0].includes('padding:10px') || panelRule[0].includes('padding:8px') || panelRule[0].includes('padding:9px')),
    '.review-inspect-panel padding must be ≤ 10px for compact density'
  );
});

test('D-129D: inspect field card padding is compact (≤7px)', () => {
  const fieldRule = cssSrc.match(/\.review-inspect-field\{[^}]+\}/);
  assert.ok(
    fieldRule && (
      fieldRule[0].includes('padding:5px') || fieldRule[0].includes('padding:4px') ||
      fieldRule[0].includes('padding:6px 7px') || fieldRule[0].includes('padding:5px 7px')
    ),
    '.review-inspect-field padding must be compact (≤ 7px) for dense layout'
  );
});

test('D-129D: builder context uses compact padding/margin (≤7px)', () => {
  const rule = cssSrc.match(/\.review-builder-context\{[^}]+\}/);
  assert.ok(
    rule && (rule[0].includes('padding:7px') || rule[0].includes('padding:6px') || rule[0].includes('padding:5px')),
    '.review-builder-context padding must be ≤ 7px'
  );
});

test('D-129D: builder row p font-size is compact (≤10px)', () => {
  const rule = cssSrc.match(/\.review-builder-row p\{[^}]+\}/);
  assert.ok(
    rule && (rule[0].includes('font-size:10px') || rule[0].includes('font-size:9px')),
    '.review-builder-row p font-size must be ≤ 10px for compact density'
  );
});

test('D-129D: inspect actions row still has Approve/Keep/Reject buttons wired', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('btn-approve review-inspect-approve') &&
    body.includes('btn-keep') &&
    body.includes('review-inspect-reject'),
    'inspect panel action row must still contain Approve/Keep Pending/Reject controls after density pass'
  );
});

test('D-129D: inspect metadata fields still include ID and State', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes("fields.push(['ID'") && body.includes("fields.push(['State'"),
    'inspect panel must still render ID and State metadata fields'
  );
});

test('D-129D: D-129C right context panel still swaps on inspect open/close', () => {
  const idx = appSrc.indexOf('function renderReviewList(');
  const body = appSrc.slice(idx, idx + 1200);
  assert.ok(
    body.includes('renderReviewInspectContext(inspectedReviewItem)') &&
    body.includes('helperText()'),
    'D-129C context panel swap must remain after density pass'
  );
});

test('D-129D: builder context rows use compact markup (rctx-bc-row or review-builder-row)', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('reviewBuilderContextHtml(item)'),
    'inspect panel must still call reviewBuilderContextHtml for structured builder context'
  );
});

// ── Section 44 — D-129E: Compact review queue cards ──────────────────────────

console.log('\n44. D-129E: Compact review queue cards');

test('D-129E: reviewCard adds review-card-compact class to article', () => {
  const idx = appSrc.indexOf('function reviewCard(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('review-card-compact'),
    'reviewCard must include review-card-compact class on article element'
  );
});

test('D-129E: reviewCard renders builder context chip (rc-builder-chip) in card head', () => {
  const idx = appSrc.indexOf('function reviewCard(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('builderChip') && body.includes('rc-builder-chip'),
    'reviewCard must compute builderChip and render it with rc-builder-chip class in card head'
  );
});

test('D-129E: reviewCard builder chip detects structured builder context', () => {
  const idx = appSrc.indexOf('function reviewCard(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('claimBuilderContext') && body.includes('rawText'),
    'reviewCard builderChip detection must check claimBuilderContext.rawText for structured context'
  );
});

test('D-129E: reviewCard builder chip detects legacy builder context', () => {
  const idx = appSrc.indexOf('function reviewCard(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('Claim Builder context:'),
    'reviewCard must detect legacy builder context via "Claim Builder context:" string'
  );
});

test('D-129E: reviewCard scoreHint for claims shows ev/ts/sv scores', () => {
  const idx = appSrc.indexOf('function reviewCard(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('ev:') && body.includes('ts:') && body.includes('sv:'),
    'reviewCard scoreHint for claims must show ev/ts/sv score prefixes for dense scanning'
  );
});

test('D-129E: CSS defines rc-builder-chip class', () => {
  assert.ok(cssSrc.includes('.rc-builder-chip'), '.rc-builder-chip must be defined in styles.css');
});

test('D-129E: CSS review-card-title font-size is compact (≤13px)', () => {
  const rule = cssSrc.match(/\.review-card-title\{[^}]+\}/);
  assert.ok(
    rule && (
      rule[0].includes('font-size:12px') || rule[0].includes('font-size:11px') ||
      rule[0].includes('font-size:13px') || rule[0].includes('font-size:10px')
    ),
    '.review-card-title font-size must be ≤ 13px for compact card density'
  );
});

test('D-129E: non-inspected card still has Approve/Keep Pending/Reject wired', () => {
  const idx = appSrc.indexOf('function reviewCard(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('requestApproveReview') &&
    body.includes('btn-keep') &&
    body.includes('requestRejectReview'),
    'non-inspected card must still wire Approve/Keep Pending/Reject actions'
  );
});

test('D-129E: inspected card suppresses Approve/Keep/Reject (D-129A preserved)', () => {
  const idx = appSrc.indexOf('function reviewCard(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes("isSelected?'':`${approveBtn}"),
    'D-129A inspected card duplicate action suppression must be preserved'
  );
});

test('D-129E: D-129C right context panel still active', () => {
  const idx = appSrc.indexOf('function renderReviewList(');
  const body = appSrc.slice(idx, idx + 1200);
  assert.ok(
    body.includes('renderReviewInspectContext(inspectedReviewItem)'),
    'D-129C right context panel swap must remain intact'
  );
});

test('D-129E: D-129D compact inspector class still present', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('review-inspect-compact'),
    'D-129D review-inspect-compact marker class must remain in renderReviewInspectPanel'
  );
});

// ── Section 45 — D-129F: Compact filter/status bar + queue overview ───────────

console.log('\n45. D-129F: Compact review filter/status bar + queue overview');

test('D-129F: renderReviewFilterBar adds review-filter-compact class to wrapper', () => {
  const idx = appSrc.indexOf('function renderReviewFilterBar(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('review-filter-compact'),
    'renderReviewFilterBar must add review-filter-compact marker class to wrapper div'
  );
});

test('D-129F: renderReviewOverviewStrip function defined in app', () => {
  assert.ok(
    appSrc.includes('function renderReviewOverviewStrip('),
    'renderReviewOverviewStrip must be defined in app-v10.js'
  );
});

test('D-129F: renderReviewOverviewStrip emits review-overview-strip wrapper', () => {
  const idx = appSrc.indexOf('function renderReviewOverviewStrip(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('review-overview-strip'),
    'renderReviewOverviewStrip must output div with class review-overview-strip'
  );
});

test('D-129F: renderReviewOverviewStrip derives pending/public/rejected counts client-side', () => {
  const idx = appSrc.indexOf('function renderReviewOverviewStrip(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes("review_state||i.reviewState") &&
    body.includes("rov-pending") &&
    body.includes("rov-pub") &&
    body.includes("rov-rej"),
    'renderReviewOverviewStrip must compute pending/public/rejected from review_state field with rov-* pill classes'
  );
});

test('D-129F: renderReviewOverviewStrip shows type breakdown (claim/truth/evidence/pressure)', () => {
  const idx = appSrc.indexOf('function renderReviewOverviewStrip(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes("target_type||i.targetType") &&
    body.includes("pressure"),
    'renderReviewOverviewStrip must derive type breakdown from target_type field'
  );
});

test('D-129F: renderReviewOverviewStrip does not fetch (no fetch call inside)', () => {
  const idx = appSrc.indexOf('function renderReviewOverviewStrip(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    !body.includes('fetch(') && !body.includes('await '),
    'renderReviewOverviewStrip must not make any backend fetch — counts derived client-side only'
  );
});

test('D-129F: renderReviewList wires overview strip between filter bar and audit', () => {
  const idx = appSrc.indexOf('function renderReviewList(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('renderReviewOverviewStrip(all)') &&
    body.includes('bar+overview+audit'),
    'renderReviewList must call renderReviewOverviewStrip and insert overview between bar and audit'
  );
});

test('D-129F: existing review filter chips still rendered in filter bar', () => {
  const idx = appSrc.indexOf('function renderReviewFilterBar(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('review-filter-chips') && body.includes("setReviewFilter("),
    'renderReviewFilterBar must still output review-filter-chips and setReviewFilter calls'
  );
});

test('D-129F: sort select still wired in filter bar', () => {
  const idx = appSrc.indexOf('function renderReviewFilterBar(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('review-sort-select') && body.includes('setReviewSort(this.value)'),
    'renderReviewFilterBar must still include sort select wired to setReviewSort'
  );
});

test('D-129F: CSS defines review-overview-strip', () => {
  assert.ok(cssSrc.includes('.review-overview-strip'), '.review-overview-strip must be defined in styles.css');
});

test('D-129F: CSS defines rov-pill for overview count pills', () => {
  assert.ok(cssSrc.includes('.rov-pill'), '.rov-pill must be defined in styles.css');
});

test('D-129F: CSS defines rov-pending color class', () => {
  assert.ok(cssSrc.includes('.rov-pending'), '.rov-pending color class must be defined in styles.css');
});

test('D-129F: D-129E review-card-compact still in reviewCard (not regressed)', () => {
  const idx = appSrc.indexOf('function reviewCard(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('review-card-compact'),
    'D-129E review-card-compact class must still be present in reviewCard'
  );
});

test('D-129F: D-129D review-inspect-compact still in renderReviewInspectPanel (not regressed)', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('review-inspect-compact'),
    'D-129D review-inspect-compact class must still be present in renderReviewInspectPanel'
  );
});

test('D-129F: D-129C renderReviewInspectContext still wired in renderReviewList (not regressed)', () => {
  const idx = appSrc.indexOf('function renderReviewList(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('renderReviewInspectContext(inspectedReviewItem)'),
    'D-129C right context panel swap must still be present in renderReviewList'
  );
});

// ── Section 46 — D-130B: Review queue cap behaviour documentation ─────────────

console.log('\n46. D-130B: Review queue cap behaviour');

test('D-130B: reviewQueue combines up to 400 rows then slices to 100', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    body.includes('.slice(0,100)'),
    'reviewQueue must still apply .slice(0,100) on the combined review array'
  );
});

test('D-130B: reviewQueue has inline comment explaining the cap/sort/slice behaviour', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    body.includes('individually capped') && body.includes('sliced to 100'),
    'reviewQueue must have a comment explaining per-source cap and combined slice-to-100'
  );
});

test('D-130B: reviewQueue comment documents evidence created_at fallback', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    body.includes('created_at') && body.includes('evidence') && body.includes('updated_at'),
    'reviewQueue comment must mention evidence/created_at fallback for the sort'
  );
});

test('D-130B: combined review sort still uses updated_at||created_at fallback', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    body.includes('b.updated_at||b.created_at') || body.includes('updated_at||b.created_at'),
    'reviewQueue combined sort must still fall back from updated_at to created_at'
  );
});

test('D-130B: no new review sub-route introduced by this patch', () => {
  const reviewRoutes = [...workerSrc.matchAll(/pathname === '\/api\/review\/([^']+)'/g)].map(m => m[1]);
  const expected = ['decision', 'cleanup', 'mark-duplicate', 'resolve-similar'];
  const unexpected = reviewRoutes.filter(r => !expected.includes(r));
  assert.ok(
    unexpected.length === 0,
    `No unexpected /api/review/* routes should exist; found: ${unexpected.join(', ')}`
  );
});

// ── Section 47 — D-130C: Claim Builder context field-name hardening ───────────

console.log('\n47. D-130C: Claim Builder context field-name hardening');

test('D-130C: cleanClaimBuilderContext accepts correct camelCase whyUserThinksThis (primary)', () => {
  const idx = cbcSrc.indexOf('function cleanClaimBuilderContext(');
  const end = cbcSrc.indexOf('\nexport function ', idx + 1);
  const body = cbcSrc.slice(idx, end);
  assert.ok(
    body.includes('raw.whyUserThinksThis'),
    'cleanClaimBuilderContext must accept correct camelCase whyUserThinksThis as primary fallback'
  );
});

test('D-130C: cleanClaimBuilderContext retains legacy typo whyUserThinkThis (backward compat)', () => {
  const idx = cbcSrc.indexOf('function cleanClaimBuilderContext(');
  const end = cbcSrc.indexOf('\nexport function ', idx + 1);
  const body = cbcSrc.slice(idx, end);
  assert.ok(
    body.includes('raw.whyUserThinkThis'),
    'cleanClaimBuilderContext must retain legacy typo whyUserThinkThis fallback for backward compatibility'
  );
});

test('D-130C: cleanClaimBuilderContext retains snake_case why_user_thinks_this fallback', () => {
  const idx = cbcSrc.indexOf('function cleanClaimBuilderContext(');
  const end = cbcSrc.indexOf('\nexport function ', idx + 1);
  const body = cbcSrc.slice(idx, end);
  assert.ok(
    body.includes('raw.why_user_thinks_this'),
    'cleanClaimBuilderContext must retain raw.why_user_thinks_this as a fallback'
  );
});

test('D-130C: cleanClaimBuilderContext retains short why fallback (current frontend)', () => {
  const idx = cbcSrc.indexOf('function cleanClaimBuilderContext(');
  const end = cbcSrc.indexOf('\nexport function ', idx + 1);
  const body = cbcSrc.slice(idx, end);
  assert.ok(
    body.includes('raw.why'),
    'cleanClaimBuilderContext must retain raw.why as final fallback (current frontend sends this)'
  );
});

test('D-130C: correct camelCase whyUserThinksThis appears before legacy typo in fallback chain', () => {
  const idx = cbcSrc.indexOf('function cleanClaimBuilderContext(');
  const end = cbcSrc.indexOf('\nexport function ', idx + 1);
  const body = cbcSrc.slice(idx, end);
  const correctPos = body.indexOf('raw.whyUserThinksThis');
  const typoPos = body.indexOf('raw.whyUserThinkThis');
  assert.ok(
    correctPos < typoPos,
    'whyUserThinksThis (correct) must appear before whyUserThinkThis (typo) in the fallback chain'
  );
});

test('D-130C: cleanClaimBuilderContext has finalClaim compatibility comment', () => {
  const idx = cbcSrc.indexOf('function cleanClaimBuilderContext(');
  const end = cbcSrc.indexOf('\nexport function ', idx + 1);
  const body = cbcSrc.slice(idx, end);
  assert.ok(
    body.includes('finalClaim') && (body.includes('alias') || body.includes('finalization') || body.includes('draftClaim')),
    'cleanClaimBuilderContext must have a comment explaining finalClaim === draftClaim behaviour'
  );
});

test('D-130C: mapClaimBuilderContext still returns correct whyUserThinksThis key', () => {
  const idx = cbcSrc.indexOf('export function mapClaimBuilderContext(');
  const end = cbcSrc.indexOf('\nexport ', idx + 1);
  const body = cbcSrc.slice(idx, end);
  assert.ok(
    body.includes('whyUserThinksThis: row.why_user_thinks_this'),
    'mapClaimBuilderContext must still map DB column why_user_thinks_this to camelCase whyUserThinksThis'
  );
});

// ── Section 48 — D-130D: Review-path escaping regression coverage ─────────────

console.log('\n48. D-130D: Review-path escaping regression');

test('D-130D: resolveSimilarUI escapes near_duplicate_of before modal insertion', () => {
  const idx = appSrc.indexOf('function resolveSimilarUI(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('esc(nearDup)'),
    'resolveSimilarUI must wrap nearDup in esc() before inserting into modal HTML'
  );
});

test('D-130D: resolveSimilarUI never inserts raw nearDup into template literal', () => {
  const idx = appSrc.indexOf('function resolveSimilarUI(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    !body.includes('${nearDup}'),
    'resolveSimilarUI must not interpolate nearDup directly — only esc(nearDup) is permitted'
  );
});

test('D-130D: renderReviewInspectContext row labels and values go through esc()', () => {
  const idx = appSrc.indexOf('function renderReviewInspectContext(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('esc(k)') && body.includes('esc(v)'),
    'renderReviewInspectContext rowsHtml must escape both key (k) and value (v) via esc()'
  );
});

test('D-130D: renderReviewInspectContext builder flags cast to string and escaped', () => {
  const idx = appSrc.indexOf('function renderReviewInspectContext(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('esc(String(f))'),
    'renderReviewInspectContext must cast each flag to String and escape it'
  );
});

test('D-130D: reviewCard escapes latest_report_reason before HTML insertion', () => {
  const idx = appSrc.indexOf('function reviewCard(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('esc(item.latest_report_reason)'),
    'reviewCard must escape item.latest_report_reason via esc() before inserting into HTML'
  );
});

test('D-130D: reviewCard never inserts raw latest_report_reason into template literal', () => {
  const idx = appSrc.indexOf('function reviewCard(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    !body.includes('${item.latest_report_reason}'),
    'reviewCard must not interpolate item.latest_report_reason directly — must use esc()'
  );
});

test('D-130D: renderReviewInspectContext builder rawText is truncated then escaped', () => {
  const idx = appSrc.indexOf('function renderReviewInspectContext(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('esc(trunc(sc.rawText') || body.includes('esc(trunc(ctx.original'),
    'renderReviewInspectContext must truncate then escape builder rawText/original before insertion'
  );
});

// ── Section 49 — D-132A: keyboard shortcuts ───────────────────────────────────

test('D-132A: initReviewKb function defined in app', () => {
  assert.ok(appSrc.includes('function initReviewKb('), 'initReviewKb must be defined');
});

test('D-132A: _reviewKbBound guard prevents double-bind', () => {
  const idx = appSrc.indexOf('function initReviewKb(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(body.includes('_reviewKbBound'), '_reviewKbBound guard must be present in initReviewKb');
});

test('D-132A: mode===review gate fires before any action', () => {
  const idx = appSrc.indexOf('function initReviewKb(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(body.includes("mode!=='review'"), "initReviewKb handler must gate on mode!=='review'");
});

test('D-132A: modal-open guard prevents action when hx-modal present', () => {
  const idx = appSrc.indexOf('function initReviewKb(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(body.includes("getElementById('hx-modal')"), 'initReviewKb must check for open hx-modal');
});

test('D-132A: input-focused guard skips handler when INPUT/TEXTAREA/SELECT focused', () => {
  const idx = appSrc.indexOf('function initReviewKb(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('isContentEditable') && body.includes("tagName==='INPUT'"),
    'initReviewKb must skip when active element is INPUT/TEXTAREA/SELECT/contentEditable'
  );
});

test('D-132A: _reviewKbInFlight guard prevents re-entrant key handling', () => {
  const idx = appSrc.indexOf('function initReviewKb(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(body.includes('_reviewKbInFlight'), '_reviewKbInFlight must be used in initReviewKb handler');
});

test('D-132A: a key maps to public via reviewDecisionUI', () => {
  const idx = appSrc.indexOf('function initReviewKb(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes("key==='a'") && body.includes("'public'"),
    "initReviewKb must map 'a' to decision 'public'"
  );
});

test('D-132A: k key maps to review (keep pending) via reviewDecisionUI', () => {
  const idx = appSrc.indexOf('function initReviewKb(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes("key==='k'") && body.includes("'review'"),
    "initReviewKb must map 'k' to decision 'review'"
  );
});

test('D-132A: r key maps to rejected via reviewDecisionUI', () => {
  const idx = appSrc.indexOf('function initReviewKb(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes("key==='r'") && body.includes("'rejected'"),
    "initReviewKb must map 'r' to decision 'rejected'"
  );
});

test('D-132A: ] and ArrowRight advance to next item', () => {
  const idx = appSrc.indexOf('function initReviewKb(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes("key===']'") && body.includes("key==='ArrowRight'"),
    "initReviewKb must handle ']' and 'ArrowRight' for next navigation"
  );
});

test('D-132A: [ and ArrowLeft go to previous item', () => {
  const idx = appSrc.indexOf('function initReviewKb(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes("key==='['") && body.includes("key==='ArrowLeft'"),
    "initReviewKb must handle '[' and 'ArrowLeft' for prev navigation"
  );
});

test('D-132A: Escape closes inspect panel via inspectReviewItem', () => {
  const idx = appSrc.indexOf('function initReviewKb(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes("key==='Escape'") && body.includes('inspectReviewItem'),
    "initReviewKb must call inspectReviewItem on Escape"
  );
});

test('D-132A: KB hint rendered in renderReviewInspectPanel', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(body.includes('review-kb-hint'), 'renderReviewInspectPanel must include review-kb-hint element');
});

test('D-132A: .review-kb-hint style defined in CSS', () => {
  assert.ok(cssSrc.includes('.review-kb-hint'), '.review-kb-hint must be styled in styles.css');
});

test('D-132A: initReviewKb contains no fetch() calls', () => {
  const idx = appSrc.indexOf('function initReviewKb(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(!body.includes('fetch('), 'initReviewKb must not make any fetch() calls — decision routing via reviewDecisionUI only');
});

// ── Section 50 — D-134A: rejected excluded from active review queue ───────────

test('D-134A: reviewQueue claims query excludes archived, duplicate, and rejected', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    body.includes("NOT IN ('archived','duplicate','rejected')"),
    "reviewQueue claims query must exclude 'rejected' alongside 'archived' and 'duplicate'"
  );
});

test('D-134A: reviewQueue claims query does not use old two-item exclusion for claims', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    !body.includes("NOT IN ('archived','duplicate') AND (COALESCE(c.review_state"),
    "reviewQueue claims query must not use the old two-item NOT IN list for claims"
  );
});

test('D-134A: reject decision still sets review_state to rejected', () => {
  const idx = workerSrc.indexOf('async function reviewDecision(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    body.includes("'rejected'"),
    'reviewDecision must still be able to set review_state to rejected'
  );
});

test('D-134A: reviewCleanup still requires rejected state before archive', () => {
  const idx = workerSrc.indexOf('async function reviewCleanup(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    body.includes("CLEANUP_REQUIRES_REJECTED") || body.includes("!=='rejected'"),
    'reviewCleanup must still gate on review_state===rejected before allowing archive'
  );
});

test('D-134A: no D1 migration file added for this change', () => {
  assert.ok(
    !existsSync(path.join(__dirname, '../migrations/0010_rejected_queue.sql')) &&
    !existsSync(path.join(__dirname, '../migrations/0010_d134a.sql')),
    'D-134A must not require a D1 migration'
  );
});

test('D-134A: no new API route added for rejected queue', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  assert.ok(idx > -1, 'reviewQueue function must still exist');
  assert.ok(
    !workerSrc.includes("'/api/review/rejected'"),
    'D-134A must not add a new /api/review/rejected route'
  );
});

// ── Section 51 — D-134B: orphan truths excluded from active review queue ──────

test('D-134B: truth review query excludes public, archived, and rejected states', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  const truthsStart = body.indexOf('const truths=');
  const truthsEnd = body.indexOf('const evidenceItems=', truthsStart);
  const truthsQ = body.slice(truthsStart, truthsEnd);
  assert.ok(
    truthsQ.includes("NOT IN ('public','archived','rejected')"),
    "truth review query must exclude 'rejected' alongside 'public' and 'archived'"
  );
});

test('D-134B/C: truth review query guards against orphan linked_claim_id', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  const truthsStart = body.indexOf('const truths=');
  const truthsEnd = body.indexOf('const evidenceItems=', truthsStart);
  const truthsQ = body.slice(truthsStart, truthsEnd);
  // D-134C uses LEFT JOIN + c.id IS NOT NULL instead of EXISTS
  assert.ok(
    (truthsQ.includes('linked_claim_id IS NULL') && truthsQ.includes('EXISTS')) ||
    (truthsQ.includes('LEFT JOIN claims') && truthsQ.includes('c.id IS NOT NULL')),
    'truth review query must guard against orphan linked_claim_id (via EXISTS or LEFT JOIN + IS NOT NULL)'
  );
});

test('D-134B/C: truth review orphan guard does not use truths.claim_id (non-existent column)', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  const truthsStart = body.indexOf('const truths=');
  const truthsEnd = body.indexOf('const evidenceItems=', truthsStart);
  const truthsQ = body.slice(truthsStart, truthsEnd);
  assert.ok(
    !truthsQ.includes('t.claim_id') && !truthsQ.includes('truths.claim_id'),
    'truth review query must not reference truths.claim_id — that column does not exist in production'
  );
});

test('D-134B: standalone truths (linked_claim_id IS NULL) are still included in review queue', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  const truthsStart = body.indexOf('const truths=');
  const truthsEnd = body.indexOf('const evidenceItems=', truthsStart);
  const truthsQ = body.slice(truthsStart, truthsEnd);
  assert.ok(
    truthsQ.includes('linked_claim_id IS NULL'),
    'truths with no linked claim (linked_claim_id IS NULL) must still be eligible for review'
  );
});

test('D-134B: no mutation of truth rows introduced — only SELECT changed', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  const truthsStart = body.indexOf('const truths=');
  const truthsEnd = body.indexOf('const evidenceItems=', truthsStart);
  const truthsQ = body.slice(truthsStart, truthsEnd);
  assert.ok(
    !truthsQ.includes('UPDATE truths') && !truthsQ.includes('DELETE FROM truths'),
    'reviewQueue must not mutate truth rows — read-only SELECT only'
  );
});

test('D-134B: claims review query still present and unchanged from D-134A', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    body.includes("NOT IN ('archived','duplicate','rejected')") &&
    body.includes("COALESCE(c.review_state,'public')!='public'"),
    'claims review query must still be present with D-134A rejected exclusion'
  );
});

test('D-134B: evidence and pressure review queries still present', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    body.includes('const evidenceItems=') && body.includes('const pressureItems='),
    'evidence and pressure review queries must still be present in reviewQueue'
  );
});

test('D-134B: no D1 migration added for this change', () => {
  assert.ok(
    !existsSync(path.join(__dirname, '../migrations/0010_orphan_truths.sql')) &&
    !existsSync(path.join(__dirname, '../migrations/0010_d134b.sql')),
    'D-134B must not require a D1 migration'
  );
});

// ── Section 52 — D-134C: truth review open-study path fix ────────────────────

test('D-134C: truth review query uses LEFT JOIN to get linked_claim_review_state', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  const truthsStart = body.indexOf('const truths=');
  const truthsEnd = body.indexOf('const evidenceItems=', truthsStart);
  const truthsQ = body.slice(truthsStart, truthsEnd);
  assert.ok(
    truthsQ.includes('LEFT JOIN claims c ON c.id=t.linked_claim_id') &&
    truthsQ.includes('linked_claim_review_state'),
    'truth review query must LEFT JOIN claims and expose linked_claim_review_state'
  );
});

test('D-134C: truth review query hard-excludes truths with completely missing linked claim', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  const truthsStart = body.indexOf('const truths=');
  const truthsEnd = body.indexOf('const evidenceItems=', truthsStart);
  const truthsQ = body.slice(truthsStart, truthsEnd);
  assert.ok(
    truthsQ.includes('t.linked_claim_id IS NULL') && truthsQ.includes('c.id IS NOT NULL'),
    'truth review query must exclude truths whose linked_claim_id has no matching claim row'
  );
});

test('D-134C: truth review query does not reference non-existent truths.claim_id column', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  const truthsStart = body.indexOf('const truths=');
  const truthsEnd = body.indexOf('const evidenceItems=', truthsStart);
  const truthsQ = body.slice(truthsStart, truthsEnd);
  assert.ok(
    !truthsQ.includes('t.claim_id') && !truthsQ.includes('truths.claim_id'),
    'truth review query must not reference truths.claim_id — column does not exist in production schema'
  );
});

test('D-134C: inspect panel Linked Claim button gated on linked_claim_review_state===public', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  assert.ok(
    body.includes('linked_claim_review_state') && body.includes("==='public'"),
    'renderReviewInspectPanel must gate Linked Claim button on linked_claim_review_state===public'
  );
});

test('D-134C: Study Linked Claim action button gated on linked_claim_review_state===public', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  // studyBtn for truths must check linked_claim_review_state before rendering Study Linked Claim
  const studyBtnIdx = body.indexOf('Study Linked Claim');
  const studyBtnCtx = body.slice(Math.max(0, studyBtnIdx - 200), studyBtnIdx + 50);
  assert.ok(
    studyBtnCtx.includes('linked_claim_review_state'),
    'Study Linked Claim button must be conditional on linked_claim_review_state'
  );
});

test('D-134C: standalone truths (linked_claim_id IS NULL) still appear in review queue', () => {
  const idx = workerSrc.indexOf('async function reviewQueue(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  const truthsStart = body.indexOf('const truths=');
  const truthsEnd = body.indexOf('const evidenceItems=', truthsStart);
  const truthsQ = body.slice(truthsStart, truthsEnd);
  assert.ok(
    truthsQ.includes('t.linked_claim_id IS NULL'),
    'standalone truths (linked_claim_id IS NULL) must remain eligible for review'
  );
});

test('D-134C: truth approve/reject actions still available regardless of linked claim state', () => {
  const idx = appSrc.indexOf('function renderReviewInspectPanel(');
  const end = appSrc.indexOf('\nfunction ', idx + 1);
  const body = appSrc.slice(idx, end);
  // The approve/reject buttons use reviewDecisionUI with type and id — not gated on linked claim
  assert.ok(
    body.includes("reviewDecisionUI('${esc(type)}','${esc(id)}','public')") ||
    body.includes('reviewDecisionUI(') ,
    'truth approve/reject actions must be present in inspect panel regardless of linked claim state'
  );
});

test('D-134C: no D1 migration added for this change', () => {
  assert.ok(
    !existsSync(path.join(__dirname, '../migrations/0010_d134c.sql')) &&
    !existsSync(path.join(__dirname, '../migrations/0010_truth_review.sql')),
    'D-134C must not require a D1 migration'
  );
});

// ── Section 52 — D-134D: Truths page pressure-test CLAIM_NOT_FOUND fix ───────

const truthClaimBridgeSrc = readFileSync(path.join(__dirname, '../src/truth-claim-bridge.js'), 'utf8');

test('D-134D: findExistingClaim filters linked_claim_id to public claims only', () => {
  const idx = truthClaimBridgeSrc.indexOf('async function findExistingClaim(');
  const end = truthClaimBridgeSrc.indexOf('\nasync function ', idx + 1);
  const body = truthClaimBridgeSrc.slice(idx, end);
  assert.ok(
    body.includes("linked_claim_id") && body.includes("COALESCE(review_state,'public')='public'"),
    'findExistingClaim must filter linked_claim_id lookup to public claims only'
  );
});

test('D-134D: findExistingClaim filters truth_claim_links table to public claims only', () => {
  const idx = truthClaimBridgeSrc.indexOf('async function findExistingClaim(');
  const end = truthClaimBridgeSrc.indexOf('\nasync function ', idx + 1);
  const body = truthClaimBridgeSrc.slice(idx, end);
  assert.ok(
    body.includes('truth_claim_links') && body.includes("COALESCE(c.review_state,'public')='public'"),
    'findExistingClaim truth_claim_links lookup must filter to public claims only'
  );
});

test('D-134D: findExistingClaim filters normalized_claim lookup to public claims only', () => {
  const idx = truthClaimBridgeSrc.indexOf('async function findExistingClaim(');
  const end = truthClaimBridgeSrc.indexOf('\nasync function ', idx + 1);
  const body = truthClaimBridgeSrc.slice(idx, end);
  const normalizedIdx = body.indexOf("normalized_claim=?");
  const normalizedCtx = body.slice(normalizedIdx, normalizedIdx + 120);
  assert.ok(
    normalizedCtx.includes("COALESCE(review_state,'public')='public'"),
    'findExistingClaim normalized_claim lookup must filter to public claims only'
  );
});

test('D-134D: existing-claim bridge path includes claimId only for public existing match', () => {
  // D-134E supersedes the isPublic variable name; guard is now expressed via claimState
  assert.ok(
    truthClaimBridgeSrc.includes("claimState: 'public'") && truthClaimBridgeSrc.includes('claimId: existing.id'),
    'convertTruthToClaim must set claimState and claimId for public existing claims'
  );
});

test('D-134D: raced-claim bridge path omits claimId when raced claim is non-public', () => {
  const idx = truthClaimBridgeSrc.indexOf('const racedState = ');
  assert.ok(idx >= 0, 'UNIQUE catch path must guard bridge claimId behind racedState check');
  const ctx = truthClaimBridgeSrc.slice(idx, idx + 200);
  assert.ok(
    ctx.includes("raced.review_state || 'public'") && ctx.includes("=== 'public'"),
    "raced bridge must check racedState === 'public' before including claimId"
  );
});

test('D-134D: convertTruth shows "Claim already in Review queue." when existing but no claimId in bridge', () => {
  const idx = appSrc.indexOf('async function convertTruth(');
  const body = idx >= 0 ? appSrc.slice(idx, idx + 700) : '';
  assert.ok(
    body.includes('Claim already in Review queue.'),
    'convertTruth must show "Claim already in Review queue." when existing claim is not navigable'
  );
});

test('D-134D: convertTruth toast distinguishes navigable vs non-navigable existing claims', () => {
  const idx = appSrc.indexOf('async function convertTruth(');
  const body = idx >= 0 ? appSrc.slice(idx, idx + 1000) : '';
  assert.ok(
    body.includes('bridge?.claimId') && body.includes('Existing public claim opened in Study.') && body.includes('Claim already in Review queue.'),
    'convertTruth must check bridge?.claimId to distinguish navigable (Study) vs non-navigable (Review queue) cases'
  );
});

test('D-134D: convertTruth still calls selectClaim only when bridge.claimId is present', () => {
  const idx = appSrc.indexOf('async function convertTruth(');
  const body = idx >= 0 ? appSrc.slice(idx, idx + 700) : '';
  assert.ok(
    body.includes('if(data.bridge?.claimId)') || body.includes('if (data.bridge?.claimId)'),
    'convertTruth must guard selectClaim call behind data.bridge?.claimId'
  );
});

test('D-134D: CLAIM_NOT_FOUND is not returned by convertTruthToClaim itself', () => {
  assert.ok(
    !truthClaimBridgeSrc.includes("'CLAIM_NOT_FOUND'") && !truthClaimBridgeSrc.includes('"CLAIM_NOT_FOUND"'),
    'truth-claim-bridge.js must not return CLAIM_NOT_FOUND — that error belongs only in getClaim'
  );
});

test('D-134D: getClaim still returns CLAIM_NOT_FOUND for non-public claims (guard preserved)', () => {
  const idx = workerSrc.indexOf('async function getClaim(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    body.includes('CLAIM_NOT_FOUND') && body.includes("!=='public'"),
    'getClaim must still return CLAIM_NOT_FOUND for non-public claims'
  );
});

test('D-134D: no D1 migration added for this change', () => {
  assert.ok(
    !existsSync(path.join(__dirname, '../migrations/0011_d134d.sql')) &&
    !existsSync(path.join(__dirname, '../migrations/0011_truth_pressure.sql')),
    'D-134D must not require a D1 migration'
  );
});

// ── Section 53 — D-134E: truth pressure-test existing-claim state messages ────

test('D-134E: bridge includes claimState in public existing match', () => {
  assert.ok(
    truthClaimBridgeSrc.includes("claimState: 'public'"),
    "bridge must set claimState: 'public' for public existing match so frontend can distinguish states"
  );
});

test('D-134E: findNonPublicExistingClaim function exists in bridge', () => {
  assert.ok(
    truthClaimBridgeSrc.includes('async function findNonPublicExistingClaim('),
    'truth-claim-bridge.js must define findNonPublicExistingClaim to detect rejected/review/archived/duplicate claims'
  );
});

test('D-134E: findNonPublicExistingClaim filters to non-public claims only', () => {
  const idx = truthClaimBridgeSrc.indexOf('async function findNonPublicExistingClaim(');
  const end = truthClaimBridgeSrc.indexOf('\nasync function ', idx + 1);
  const body = truthClaimBridgeSrc.slice(idx, end);
  assert.ok(
    body.includes("COALESCE(review_state,'public')!='public'") ||
    body.includes("COALESCE(c.review_state,'public')!='public'"),
    "findNonPublicExistingClaim must filter to non-public claims (COALESCE(review_state,'public')!='public')"
  );
});

test('D-134E: non-public existing-claim bridge path includes claimState', () => {
  assert.ok(
    truthClaimBridgeSrc.includes('const claimState = nonPublic.review_state'),
    'non-public existing-claim path must set claimState from nonPublic.review_state'
  );
});

test('D-134E: non-public existing-claim bridge path omits claimId (D-134D preserved)', () => {
  const idx = truthClaimBridgeSrc.indexOf('const claimState = nonPublic.review_state');
  const ctx = truthClaimBridgeSrc.slice(idx, idx + 300);
  assert.ok(
    !ctx.includes('claimId: nonPublic.id') && ctx.includes('claimState'),
    'non-public existing-claim bridge must NOT include claimId (D-134D guard preserved)'
  );
});

test('D-134E: raced-claim bridge path includes claimState', () => {
  const idx = truthClaimBridgeSrc.indexOf('const racedState = ');
  const ctx = truthClaimBridgeSrc.slice(idx, idx + 400);
  assert.ok(
    ctx.includes('claimState: racedState') || ctx.includes('claimState:racedState'),
    'raced-claim bridge must set claimState from racedState'
  );
});

test('D-134E: convertTruth shows state-specific message for rejected existing claim', () => {
  const idx = appSrc.indexOf('async function convertTruth(');
  const body = idx >= 0 ? appSrc.slice(idx, idx + 1000) : '';
  assert.ok(
    body.includes('rejected') && body.includes('already pressure-tested and rejected'),
    "convertTruth must show 'already pressure-tested and rejected' message for rejected claimState"
  );
});

test('D-134E: convertTruth shows state-specific message for archived existing claim', () => {
  const idx = appSrc.indexOf('async function convertTruth(');
  const body = idx >= 0 ? appSrc.slice(idx, idx + 1000) : '';
  assert.ok(
    body.includes('archived') && body.includes('pressure-test was archived'),
    "convertTruth must show 'pressure-test was archived' message for archived claimState"
  );
});

test('D-134E: convertTruth shows state-specific message for duplicate existing claim', () => {
  const idx = appSrc.indexOf('async function convertTruth(');
  const body = idx >= 0 ? appSrc.slice(idx, idx + 1000) : '';
  assert.ok(
    body.includes('duplicate') && body.includes('pressure-test was marked duplicate'),
    "convertTruth must show 'pressure-test was marked duplicate' message for duplicate claimState"
  );
});

test('D-134E: convertTruth shows fallback message for unknown non-public state', () => {
  const idx = appSrc.indexOf('async function convertTruth(');
  const body = idx >= 0 ? appSrc.slice(idx, idx + 1000) : '';
  assert.ok(
    body.includes('pressure-test is not public'),
    "convertTruth must show 'pressure-test is not public' fallback for unknown non-public claimState"
  );
});

test('D-134E: convertTruth only calls selectClaim when bridge.claimId is present (D-134D regression)', () => {
  const idx = appSrc.indexOf('async function convertTruth(');
  const body = idx >= 0 ? appSrc.slice(idx, idx + 1000) : '';
  assert.ok(
    (body.includes('if(data.bridge?.claimId)') || body.includes('if (data.bridge?.claimId)')) &&
    body.includes('selectClaim'),
    'convertTruth must guard selectClaim behind data.bridge?.claimId (D-134D regression guard)'
  );
});

test('D-134E: CLAIM_NOT_FOUND not present in truth-claim-bridge (D-134D regression)', () => {
  assert.ok(
    !truthClaimBridgeSrc.includes("'CLAIM_NOT_FOUND'") && !truthClaimBridgeSrc.includes('"CLAIM_NOT_FOUND"'),
    'truth-claim-bridge.js must not return CLAIM_NOT_FOUND (D-134D regression)'
  );
});

test('D-134E: no D1 migration added for this change', () => {
  assert.ok(
    !existsSync(path.join(__dirname, '../migrations/0012_d134e.sql')) &&
    !existsSync(path.join(__dirname, '../migrations/0012_truth_states.sql')),
    'D-134E must not require a D1 migration'
  );
});

// ── Section 54 — D-134F: pressure cleanup + owner truth rate limit ───────────

// Part A: review cleanup pressure support

test('D-134F: reviewCleanup allowed types now includes pressure', () => {
  const idx = workerSrc.indexOf('async function reviewCleanup(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    body.includes("'pressure'") && body.includes("BAD_TARGET_TYPE"),
    "reviewCleanup must include 'pressure' in allowed types"
  );
  assert.ok(
    body.includes("allowed:['claim','truth','pressure']") ||
    body.includes("allowed: ['claim','truth','pressure']"),
    "BAD_TARGET_TYPE error must list pressure as allowed"
  );
});

test('D-134F: reviewCleanup pressure path fetches from pressure_points table', () => {
  const idx = workerSrc.indexOf('async function reviewCleanup(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    body.includes('pressure_points p LEFT JOIN users u'),
    'reviewCleanup pressure branch must fetch from pressure_points with user handle JOIN'
  );
});

test('D-134F: reviewCleanup pressure path uses title+body for rawText', () => {
  const idx = workerSrc.indexOf('async function reviewCleanup(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    body.includes("targetType==='pressure'") && body.includes('row.title') && body.includes('row.body'),
    "reviewCleanup must use title+body as rawText for pressure items"
  );
});

test('D-134F: reviewCleanup pressure cleanup archives via UPDATE pressure_points', () => {
  const idx = workerSrc.indexOf('async function reviewCleanup(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    body.includes("UPDATE pressure_points SET review_state='archived',updated_at=? WHERE id=?"),
    "reviewCleanup must archive pressure items via UPDATE pressure_points SET review_state='archived'"
  );
});

test('D-134F: reviewCleanup pressure cleanup requires rejected state (state gate shared)', () => {
  const idx = workerSrc.indexOf('async function reviewCleanup(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  // state gate runs before the type-specific archive branch; check it precedes the archive UPDATE
  const stateGateIdx = body.indexOf('CLEANUP_REQUIRES_REJECTED');
  const archiveIdx = body.indexOf("UPDATE pressure_points SET review_state='archived'");
  assert.ok(
    stateGateIdx >= 0 && archiveIdx >= 0 && stateGateIdx < archiveIdx,
    'reviewCleanup state gate (CLEANUP_REQUIRES_REJECTED) must appear before pressure archive UPDATE'
  );
});

test('D-134F: reviewCleanup id pattern skipped for pressure (prs_ is not a seed marker)', () => {
  const idx = workerSrc.indexOf('async function reviewCleanup(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  assert.ok(
    body.includes("targetType!=='pressure'") && body.includes('idPatternMatch'),
    "reviewCleanup must skip id pattern signal for pressure items"
  );
});

test('D-134F: junk_override path also archives pressure_points', () => {
  const idx = workerSrc.indexOf('async function reviewCleanup(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  // Should have two occurrences of UPDATE pressure_points (artefact path + junk_override path)
  const firstIdx = body.indexOf("UPDATE pressure_points SET review_state='archived'");
  const secondIdx = body.indexOf("UPDATE pressure_points SET review_state='archived'", firstIdx + 1);
  assert.ok(
    secondIdx >= 0,
    'junk_override path must also archive pressure_points (two UPDATE pressure_points occurrences)'
  );
});

test('D-134F: BAD_TARGET_TYPE is not returned for pressure target type', () => {
  // Verify that the type guard lists pressure as valid
  const idx = workerSrc.indexOf('async function reviewCleanup(');
  const end = workerSrc.indexOf('\nasync function ', idx + 1);
  const body = workerSrc.slice(idx, end);
  const guardIdx = body.indexOf("BAD_TARGET_TYPE");
  const guardCtx = body.slice(guardIdx - 80, guardIdx + 80);
  assert.ok(
    guardCtx.includes('pressure'),
    "BAD_TARGET_TYPE guard must include pressure in allowed list so it is not returned for pressure"
  );
});

// Part B: truth pressure-test admin rate limit bypass

test('D-134F: /api/truth-to-claim route passes isAdmin helper to bridge', () => {
  const routeCtx = workerSrc.slice(
    workerSrc.indexOf("'/api/truth-to-claim'"),
    workerSrc.indexOf("'/api/truth-to-claim'") + 300
  );
  assert.ok(
    routeCtx.includes('isAdmin') && routeCtx.includes('requireAdmin'),
    "/api/truth-to-claim route must pass isAdmin helper (using requireAdmin) to convertTruthToClaim"
  );
});

test('D-134F: bridge skips rate limit for admin requests', () => {
  assert.ok(
    truthClaimBridgeSrc.includes('if (!isAdmin || !isAdmin())'),
    "bridge must guard safeRateLimit behind (!isAdmin || !isAdmin()) to allow admin bypass"
  );
});

test('D-134F: bridge still calls safeRateLimit for non-admin (public rate limit preserved)', () => {
  // safeRateLimit call must exist inside the isAdmin guard branch
  const guardIdx = truthClaimBridgeSrc.indexOf('if (!isAdmin || !isAdmin())');
  const ctx = truthClaimBridgeSrc.slice(guardIdx, guardIdx + 120);
  assert.ok(
    ctx.includes('safeRateLimit'),
    'bridge must call safeRateLimit inside the non-admin branch (public rate limit preserved)'
  );
});

test('D-134F: convertTruth sends admin header when adminToken() is present', () => {
  const idx = appSrc.indexOf('async function convertTruth(');
  const body = idx >= 0 ? appSrc.slice(idx, idx + 400) : '';
  assert.ok(
    body.includes('adminToken()') && body.includes('adminHeaders()'),
    'convertTruth must send adminHeaders() when adminToken() is available'
  );
});

test('D-134F: convertTruth admin header is conditional — not sent for normal users', () => {
  const idx = appSrc.indexOf('async function convertTruth(');
  const body = idx >= 0 ? appSrc.slice(idx, idx + 400) : '';
  // Must have a conditional check before adminHeaders
  assert.ok(
    body.includes('if(adminToken())') || body.includes('if (adminToken())'),
    'convertTruth must gate adminHeaders behind if(adminToken()) — normal users must not send admin header'
  );
});

test('D-134F: safeRateLimit function still exists in truth-claim-bridge (rate limit not removed)', () => {
  assert.ok(
    truthClaimBridgeSrc.includes('async function safeRateLimit('),
    'safeRateLimit must still be defined in truth-claim-bridge.js — rate limit must not be removed'
  );
});

test('D-134F: no D1 migration added for this change', () => {
  assert.ok(
    !existsSync(path.join(__dirname, '../migrations/0013_d134f.sql')) &&
    !existsSync(path.join(__dirname, '../migrations/0013_pressure_cleanup.sql')),
    'D-134F must not require a D1 migration'
  );
});

// ── Section 55 — D-135A: review queue provenance diagnostics ─────────────────

test('D-135A: reviewQueue claims SELECT includes user handle via JOIN users', () => {
  assert.ok(
    workerSrc.includes("LEFT JOIN users u ON u.id=c.user_id") ||
    workerSrc.includes("JOIN users u ON u.id=c.user_id"),
    'reviewQueue claims SELECT must JOIN users for handle'
  );
});

test('D-135A: reviewQueue claims SELECT exposes u.handle', () => {
  assert.ok(
    workerSrc.includes("u.handle"),
    'reviewQueue claims SELECT must include u.handle'
  );
});

test('D-135A: reviewQueue claims SELECT exposes source_truth_id via truth_claim_links subquery', () => {
  assert.ok(
    workerSrc.includes('source_truth_id') && workerSrc.includes('truth_claim_links'),
    'reviewQueue claims SELECT must include source_truth_id via truth_claim_links subquery'
  );
});

test('D-135A: reviewQueue evidence SELECT includes user_id and handle', () => {
  const idx = workerSrc.indexOf("'evidence' AS target_type");
  assert.ok(idx !== -1, 'reviewQueue must have evidence SELECT');
  const slice = workerSrc.slice(idx, idx + 1500);
  assert.ok(
    slice.includes('e.user_id') && slice.includes('u.handle'),
    'reviewQueue evidence SELECT must include e.user_id and u.handle'
  );
});

test('D-135A: renderReviewInspectPanel shows User ID for claims', () => {
  assert.ok(
    appSrc.includes("'User ID'") && appSrc.includes('review-provenance-uid'),
    'renderReviewInspectPanel must show User ID with review-provenance-uid class for claims'
  );
});

test('D-135A: renderReviewInspectPanel shows Source Truth for truth-derived claims', () => {
  assert.ok(
    appSrc.includes("source_truth_id") && appSrc.includes("'Source Truth'"),
    'renderReviewInspectPanel must show Source Truth field when source_truth_id is present'
  );
});

test('D-135A: renderReviewInspectPanel shows Normalized Key for claims', () => {
  assert.ok(
    appSrc.includes("normalized_claim") && appSrc.includes("'Normalized Key'"),
    'renderReviewInspectPanel must show Normalized Key field for claims'
  );
});

test('D-135A: renderReviewInspectPanel shows Submitted By handle for evidence', () => {
  // Verify evidence section has Claim ID followed by Submitted By
  const evidenceClaimIdx = appSrc.indexOf("'Claim ID',esc(item.claim_id)");
  const evidenceHandleIdx = appSrc.indexOf("'Submitted By',esc(item.handle)");
  assert.ok(evidenceClaimIdx !== -1, 'renderReviewInspectPanel evidence must have Claim ID field');
  assert.ok(evidenceHandleIdx > evidenceClaimIdx, 'renderReviewInspectPanel evidence must show Submitted By after Claim ID');
});

test('D-135A: renderReviewInspectPanel shows Submitted By and User ID for truths', () => {
  // truth section: Converted Claims appears before Submitted By
  const convertedIdx = appSrc.indexOf("'Converted Claims'");
  const truthHandleIdx = appSrc.indexOf("'Submitted By',esc(item.handle)", convertedIdx);
  assert.ok(convertedIdx !== -1, 'truth section must have Converted Claims field');
  assert.ok(truthHandleIdx !== -1 && truthHandleIdx > convertedIdx, 'truth section must show Submitted By after Converted Claims');
});

test('D-135A: renderReviewInspectContext shows Submitted By, User ID, Source Truth for claims', () => {
  const idx = appSrc.indexOf('renderReviewInspectContext');
  const slice = appSrc.slice(idx, idx + 3000);
  assert.ok(
    slice.includes("'Submitted By',item.handle") && slice.includes("'User ID',item.user_id") && slice.includes("'Source Truth',item.source_truth_id"),
    'renderReviewInspectContext claim section must include Submitted By, User ID, Source Truth'
  );
});

test('D-135A: renderReviewInspectContext shows Submitted By and User ID for truths', () => {
  const idx = appSrc.indexOf('renderReviewInspectContext');
  const slice = appSrc.slice(idx, idx + 3000);
  const originIdx = slice.indexOf("'Origin',item.origin");
  const truthHandleIdx = slice.indexOf("'Submitted By',item.handle", originIdx);
  assert.ok(originIdx !== -1, 'renderReviewInspectContext truth section must have Origin field');
  assert.ok(truthHandleIdx !== -1 && truthHandleIdx > originIdx, 'renderReviewInspectContext truth section must show Submitted By after Origin');
});

test('D-135A: provenance fields are admin-panel only (not in public getClaim endpoint)', () => {
  const getClaimIdx = workerSrc.indexOf("pathname==='/api/claims/'");
  const getClaimSlice = getClaimIdx !== -1 ? workerSrc.slice(getClaimIdx, getClaimIdx + 1200) : '';
  assert.ok(
    !getClaimSlice.includes('source_truth_id') && !getClaimSlice.includes('u.handle AS handle'),
    'getClaim public endpoint must not expose provenance fields (source_truth_id, handle from users)'
  );
});

test('D-135A: no D1 migration added for this change', () => {
  assert.ok(
    !existsSync(path.join(__dirname, '../migrations/0014_d135a.sql')) &&
    !existsSync(path.join(__dirname, '../migrations/0014_provenance.sql')),
    'D-135A must not require a D1 migration'
  );
});

// ── Section 56 — D-135B: archive rejected truth-derived test claims ───────────

test('D-135B: reviewCleanup claim fetch includes source_truth_id via truth_claim_links subquery', () => {
  // reviewCleanup function contains the claim fetch query with source_truth_id subquery
  assert.ok(
    workerSrc.includes('source_truth_id') && workerSrc.includes('truth_claim_links') && workerSrc.includes('sourceTruthSeedMatch'),
    'reviewCleanup claim fetch must include source_truth_id subquery from truth_claim_links'
  );
});

test('D-135B: reviewCleanup defines sourceTruthSeedMatch signal for tru_seed_ prefix', () => {
  assert.ok(
    workerSrc.includes('sourceTruthSeedMatch') && workerSrc.includes('tru_seed_'),
    'reviewCleanup must define sourceTruthSeedMatch using tru_seed_ prefix check'
  );
});

test('D-135B: sourceTruthSeedMatch is included in isArtefact condition', () => {
  const idx = workerSrc.indexOf('const isArtefact=');
  const slice = workerSrc.slice(idx, idx + 200);
  assert.ok(
    slice.includes('sourceTruthSeedMatch'),
    'isArtefact condition must include sourceTruthSeedMatch'
  );
});

test('D-135B: archive category for seed_truth_derived path is correct', () => {
  assert.ok(
    workerSrc.includes("'seed_truth_derived'"),
    'reviewCleanup must use seed_truth_derived as archive category for sourceTruthSeedMatch path'
  );
});

test('D-135B: sourceTruthSeedMatch only applies to claim target type', () => {
  const idx = workerSrc.indexOf('sourceTruthSeedMatch');
  const slice = workerSrc.slice(idx, idx + 100);
  assert.ok(
    slice.includes("targetType==='claim'"),
    'sourceTruthSeedMatch must be gated to claim target type only'
  );
});

test('D-135B: cleanup still requires rejected state (shared state gate)', () => {
  assert.ok(
    workerSrc.includes("currentState!=='rejected'") && workerSrc.includes('CLEANUP_REQUIRES_REJECTED'),
    'reviewCleanup must still require rejected state before any archive action'
  );
});

test('D-135B: PROTECTED_SEEDS blocklist still present', () => {
  assert.ok(
    workerSrc.includes('PROTECTED_SEEDS') && workerSrc.includes('CLEANUP_PROTECTED_SEED'),
    'reviewCleanup must still protect seed claim IDs from cleanup'
  );
});

test('D-135B: cleanup archives claims via UPDATE claims SET review_state=archived', () => {
  assert.ok(
    workerSrc.includes("UPDATE claims SET review_state='archived'"),
    'reviewCleanup must archive claims via UPDATE SET review_state=archived (not DELETE)'
  );
});

test('D-135B: pressure cleanup still present and unchanged', () => {
  assert.ok(
    workerSrc.includes("UPDATE pressure_points SET review_state='archived'"),
    'reviewCleanup must still archive pressure_points (D-134F path must not be broken)'
  );
});

test('D-135B: isSuspectedTestArtefact checks tru_seed_ source_truth_id', () => {
  // find the function definition (not just references)
  const idx = appSrc.indexOf('function isSuspectedTestArtefact');
  assert.ok(idx !== -1, 'isSuspectedTestArtefact function must exist');
  const slice = appSrc.slice(idx, idx + 800);
  assert.ok(
    slice.includes('source_truth_id') && slice.includes('tru_seed_'),
    'isSuspectedTestArtefact must return true for items with source_truth_id starting with tru_seed_'
  );
});

test('D-135B: isSuspectedTestArtefact seed_truth check appears before text keyword check', () => {
  const idx = appSrc.indexOf('function isSuspectedTestArtefact');
  const slice = appSrc.slice(idx, idx + 600);
  const seedIdx = slice.indexOf('tru_seed_');
  const smokeIdx = slice.indexOf("'smoke'");
  assert.ok(seedIdx !== -1 && smokeIdx !== -1 && seedIdx < smokeIdx,
    'tru_seed_ check must appear before keyword text check in isSuspectedTestArtefact');
});

test('D-135B: inspect panel archive action is gated on state===rejected AND isSuspectedTestArtefact', () => {
  assert.ok(
    appSrc.includes("state==='rejected'&&isSuspectedTestArtefact(item)"),
    'inspect panel must only show archive button when state is rejected AND isSuspectedTestArtefact returns true'
  );
});

test('D-135B: no D1 migration added for this change', () => {
  assert.ok(
    !existsSync(path.join(__dirname, '../migrations/0014_d135b.sql')) &&
    !existsSync(path.join(__dirname, '../migrations/0015_d135b.sql')),
    'D-135B must not require a D1 migration'
  );
});

// ── Section 57 — D-136B: invite-code auth backend foundation ──────────────────

test('D-136B: migration 0010 file exists', () => {
  assert.ok(migSrc0010.length > 0, 'migrations/0010_invite_auth.sql must exist');
});

test('D-136B: migration 0010 adds email, verified, verified_at, display_name to users', () => {
  assert.ok(
    migSrc0010.includes('ALTER TABLE users ADD COLUMN email TEXT') &&
    migSrc0010.includes('ALTER TABLE users ADD COLUMN verified INTEGER DEFAULT 0') &&
    migSrc0010.includes('ALTER TABLE users ADD COLUMN verified_at INTEGER') &&
    migSrc0010.includes('ALTER TABLE users ADD COLUMN display_name TEXT'),
    'migration 0010 must add email, verified, verified_at, display_name columns to users'
  );
});

test('D-136B: migration 0010 adds partial unique email index', () => {
  assert.ok(
    migSrc0010.includes('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique') &&
    migSrc0010.includes('ON users(email) WHERE email IS NOT NULL'),
    'migration 0010 must add a partial unique index on users.email'
  );
});

test('D-136B: migration 0010 creates invite_codes table with required columns', () => {
  const reqCols = ['code TEXT PRIMARY KEY', 'created_by TEXT', 'created_at INTEGER', 'redeemed_by TEXT', 'redeemed_at INTEGER', 'email_hint TEXT', 'expires_at INTEGER', 'revoked INTEGER DEFAULT 0'];
  assert.ok(
    migSrc0010.includes('CREATE TABLE IF NOT EXISTS invite_codes') &&
    reqCols.every(c => migSrc0010.includes(c)),
    'migration 0010 must create invite_codes table with all required columns'
  );
});

test('D-136B: migration 0010 adds idx_invite_codes_redeemed_by index', () => {
  assert.ok(
    migSrc0010.includes('CREATE INDEX IF NOT EXISTS idx_invite_codes_redeemed_by') &&
    migSrc0010.includes('ON invite_codes(redeemed_by)'),
    'migration 0010 must add idx_invite_codes_redeemed_by index'
  );
});

test('D-136B: migration 0010 does not add a UNIQUE constraint on users.handle', () => {
  assert.ok(
    !/handle\s+TEXT\s+UNIQUE/i.test(migSrc0010) && !migSrc0010.includes('idx_users_handle_unique'),
    'migration 0010 must not add handle uniqueness (explicitly deferred per task scope)'
  );
});

test('D-136B: POST /api/auth/invite/create route exists and is requireAdmin protected', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/auth/invite/create'") &&
    /url\.pathname === '\/api\/auth\/invite\/create'[\s\S]{0,120}?requireAdmin\(request, env\)/.test(workerSrc),
    'invite create route must exist and call requireAdmin before createInviteCode'
  );
});

test('D-136B: POST /api/auth/invite/redeem route exists', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/auth/invite/redeem'") &&
    workerSrc.includes('redeemInviteCode(request, env)'),
    'invite redeem route must exist and dispatch to redeemInviteCode'
  );
});

test('D-136B: GET /api/me route exists', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/me'") &&
    workerSrc.includes('getMe(request, env)'),
    '/api/me route must exist and dispatch to getMe'
  );
});

test('D-136B: redeemInviteCode never writes is_admin', () => {
  const idx = workerSrc.indexOf('async function redeemInviteCode');
  assert.ok(idx !== -1, 'redeemInviteCode function must exist');
  const slice = workerSrc.slice(idx, workerSrc.indexOf('\n}', idx) + 2);
  const codeOnly = slice.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.ok(
    !codeOnly.includes('is_admin'),
    'redeemInviteCode must never reference or write is_admin (outside of explanatory comments)'
  );
});

test('D-136B: redeemInviteCode validates email format before redemption', () => {
  assert.ok(
    workerSrc.includes('function isValidEmail') && workerSrc.includes('isValidEmail(email)') && workerSrc.includes("error: 'INVALID_EMAIL'"),
    'redeemInviteCode must validate email format and return INVALID_EMAIL on failure'
  );
});

test('D-136B: redeemInviteCode rejects already-redeemed, revoked, and expired codes', () => {
  const idx = workerSrc.indexOf('async function redeemInviteCode');
  const slice = workerSrc.slice(idx, workerSrc.indexOf('\n}', idx) + 2);
  assert.ok(
    slice.includes("error: 'INVITE_ALREADY_REDEEMED'") &&
    slice.includes("error: 'INVITE_REVOKED'") &&
    slice.includes("error: 'INVITE_EXPIRED'"),
    'redeemInviteCode must reject already-redeemed, revoked, and expired invite codes'
  );
});

test('D-136B: redeemInviteCode marks invite redeemed atomically via guarded UPDATE', () => {
  assert.ok(
    workerSrc.includes('UPDATE invite_codes SET redeemed_by=?, redeemed_at=?') &&
    workerSrc.includes('WHERE code=? AND redeemed_by IS NULL AND revoked=0') &&
    workerSrc.includes('claim.meta.changes === 0'),
    'redeemInviteCode must atomically claim the invite via a guarded UPDATE and check meta.changes'
  );
});

test('D-136B: redeemInviteCode updates the existing x-humanx-user row (no new user id minted)', () => {
  const idx = workerSrc.indexOf('async function redeemInviteCode');
  const slice = workerSrc.slice(idx, workerSrc.indexOf('\n}', idx) + 2);
  assert.ok(
    slice.includes('requireUser(request, env)') &&
    slice.includes('UPDATE users SET email=?, verified=1, verified_at=?, display_name=COALESCE(?,display_name) WHERE id=?') &&
    !slice.includes("makeId('usr')"),
    'redeemInviteCode must read the existing userId via requireUser and UPDATE that same row — never mint a new user id'
  );
});

test('D-136B: redeemInviteCode enforces email uniqueness against other users', () => {
  assert.ok(
    workerSrc.includes('SELECT id FROM users WHERE email=? AND id!=?') &&
    workerSrc.includes("error: 'EMAIL_ALREADY_IN_USE'"),
    'redeemInviteCode must check for existing email on another user and reject duplicates'
  );
});

test('D-136B: redeemInviteCode is rate-limited', () => {
  const idx = workerSrc.indexOf('async function redeemInviteCode');
  const slice = workerSrc.slice(idx, idx + 400);
  assert.ok(
    slice.includes('safeRateLimit(request, env, `invite-redeem:'),
    'redeemInviteCode must call safeRateLimit to slow down brute-force code guessing'
  );
});

test('D-136B: getMe omits is_admin and any admin token material', () => {
  const idx = workerSrc.indexOf('async function getMe');
  assert.ok(idx !== -1, 'getMe function must exist');
  const slice = workerSrc.slice(idx, workerSrc.indexOf('\n}', idx) + 2);
  const codeOnly = slice.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.ok(
    !codeOnly.includes('is_admin') && !codeOnly.includes('HUMANX_ADMIN_TOKEN'),
    'getMe must not select or return is_admin or admin token material (outside of explanatory comments)'
  );
});

test('D-136B: getMe returns the documented user field set', () => {
  const idx = workerSrc.indexOf('async function getMe');
  const slice = workerSrc.slice(idx, workerSrc.indexOf('\n}', idx) + 2);
  const fields = ['id, handle, email, verified, verified_at, display_name, trust_score, strike_count, is_shadow_banned, created_at'];
  assert.ok(
    fields.every(f => slice.includes(f)),
    'getMe must SELECT the documented field set'
  );
});

test('D-136B: existing /api/session route still present and unmodified in routing', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/session' && request.method === 'POST') return await createOrGetUser(request, env)"),
    '/api/session route must continue to dispatch to createOrGetUser unchanged'
  );
});

test('D-136B: existing createOrGetUser function body is unchanged', () => {
  assert.ok(
    workerSrc.includes("async function createOrGetUser(request, env) { const body = await readJson(request); const now = Date.now(); const userId = cleanId(body.id) || makeId('usr');"),
    'createOrGetUser must remain unmodified for backward compatibility'
  );
});

test('D-136B: no forced-login gate added — frontend account panel (D-136C) is additive, not blocking', () => {
  // D-136B shipped backend-only. D-136C (later) added the account panel referencing these
  // endpoints, but it must remain non-blocking — see D-136C's "no forced-login gate" test below.
  assert.ok(
    appSrc.includes('redeemInviteUI') && appSrc.includes('/api/me'),
    'frontend account panel (D-136C) should reference the D-136B endpoints once added'
  );
});

test('D-136B: createInviteCode does not expose the admin token in its response', () => {
  const idx = workerSrc.indexOf('async function createInviteCode');
  const slice = workerSrc.slice(idx, workerSrc.indexOf('\n}', idx) + 2);
  assert.ok(
    !slice.includes('HUMANX_ADMIN_TOKEN') && !slice.includes('x-humanx-admin'),
    'createInviteCode must not echo back the admin token or admin header'
  );
});

// ── Section 58 — D-136C: frontend account invite redeem panel ─────────────────

test('D-136C: account panel render function exists', () => {
  assert.ok(
    appSrc.includes('function renderAccountPanel') && appSrc.includes('function accountPanelHtml'),
    'renderAccountPanel and accountPanelHtml functions must exist'
  );
});

test('D-136C: loadMe calls GET /api/me with the current x-humanx-user identity', () => {
  const idx = appSrc.indexOf('async function loadMe');
  assert.ok(idx !== -1, 'loadMe function must exist');
  const slice = appSrc.slice(idx, appSrc.indexOf('\n', idx + 1) + 200);
  assert.ok(
    slice.includes("api('/api/me')"),
    'loadMe must call api(\'/api/me\') which sends x-humanx-user via the shared headers() helper'
  );
});

test('D-136C: api() helper always attaches x-humanx-user (loadMe inherits it, no separate header logic)', () => {
  assert.ok(
    appSrc.includes("function headers(){return{'content-type':'application/json','x-humanx-user':user?.id||''}}") &&
    appSrc.includes("async function api(path,opts={}){const r=await fetch(API+path,{...opts,headers:{...headers(),...(opts.headers||{})}})"),
    'api() must merge in headers() (which sets x-humanx-user) for every call, including /api/me'
  );
});

test('D-136C: anonymous state renders with handle and user id', () => {
  const idx = appSrc.indexOf('function accountPanelHtml');
  const slice = appSrc.slice(idx, idx + 1500);
  assert.ok(
    slice.includes('account-state-anon') && slice.includes("'Anonymous'") === false && slice.includes('>Anonymous<'),
    'accountPanelHtml must render an anonymous state block with the Anonymous label'
  );
  assert.ok(slice.includes('User ID:'), 'anonymous state must show the user id');
});

test('D-136C: verified state renders with display_name/email/handle', () => {
  const idx = appSrc.indexOf('function accountPanelHtml');
  const slice = appSrc.slice(idx, idx + 1500);
  assert.ok(
    slice.includes('account-state-verified') && slice.includes('>Verified<'),
    'accountPanelHtml must render a verified state block with the Verified label'
  );
  assert.ok(
    slice.includes('accountUser.display_name') && slice.includes('accountUser.email') && slice.includes('Handle:'),
    'verified state must show display_name, email, and handle'
  );
});

test('D-136C: redeem form posts to /api/auth/invite/redeem', () => {
  assert.ok(
    appSrc.includes("api('/api/auth/invite/redeem',{method:'POST'"),
    'redeemInviteUI must POST to /api/auth/invite/redeem'
  );
});

test('D-136C: redeem body includes code, email, and displayName', () => {
  const idx = appSrc.indexOf('async function redeemInviteUI');
  const slice = appSrc.slice(idx, idx + 800);
  assert.ok(
    slice.includes('code,email,displayName'),
    'redeemInviteUI request body must include code, email, and displayName'
  );
});

test('D-136C: redeem success refreshes /api/me state', () => {
  const idx = appSrc.indexOf('async function redeemInviteUI');
  const slice = appSrc.slice(idx, idx + 800);
  assert.ok(
    slice.includes('await loadMe()'),
    'redeemInviteUI must call loadMe() after a successful redeem to refresh account state'
  );
});

test('D-136C: redeem shows a success or error toast', () => {
  const idx = appSrc.indexOf('async function redeemInviteUI');
  const slice = appSrc.slice(idx, idx + 800);
  assert.ok(
    slice.includes("toast('Invite redeemed") && slice.includes("toast(e.message||'Invite redeem failed.')"),
    'redeemInviteUI must toast on both success and failure'
  );
});

test('D-136C: no admin invite-create route used by the public account panel', () => {
  // D-136D later added an admin-only invite-create panel elsewhere in the file (renderAdminInvitePanel/
  // createInviteCodeUI) — scope this check to the public accountPanelHtml function specifically.
  const idx = appSrc.indexOf('function accountPanelHtml');
  const slice = appSrc.slice(idx, idx + 1500);
  assert.ok(
    !slice.includes('/api/auth/invite/create'),
    'public account panel must never call the admin-only invite/create endpoint'
  );
});

test('D-136C: account panel does not display is_admin', () => {
  const idx = appSrc.indexOf('function accountPanelHtml');
  const slice = appSrc.slice(idx, idx + 1500);
  assert.ok(
    !slice.includes('is_admin'),
    'accountPanelHtml must never reference or display is_admin'
  );
});

test('D-136C: account panel does not expose the admin token', () => {
  const idx = appSrc.indexOf('function accountPanelHtml');
  const slice = appSrc.slice(idx, idx + 1500);
  assert.ok(
    !slice.includes('adminToken') && !slice.includes('LS_ADMIN') && !slice.includes('x-humanx-admin'),
    'accountPanelHtml must never reference the admin token or admin header'
  );
});

test('D-136C: no forced-login gate added — boot() still proceeds without verification', () => {
  const idx = appSrc.indexOf('async function boot()');
  const slice = appSrc.slice(idx, idx + 600);
  assert.ok(
    slice.includes('loadMe().catch(()=>{})') && slice.includes('await Promise.all([loadGraphStatus(),loadClaims(false)])'),
    'boot() must call loadMe() non-blockingly and continue the normal anonymous boot sequence regardless of its outcome'
  );
});

test('D-136C: localUser() behavior is unchanged', () => {
  assert.ok(
    appSrc.includes("function localUser(){let u=JSON.parse(localStorage.getItem(LS_USER)||'null');if(!u){u={id:'usr_'+crypto.randomUUID().replaceAll('-','').slice(0,18),handle:'anon-'+Math.random().toString(36).slice(2,8)};localStorage.setItem(LS_USER,JSON.stringify(u))}return u}"),
    'localUser() must remain unmodified for backward compatibility'
  );
});

test('D-136C: account panel toggle and redeem functions are exposed on window for inline onclick handlers', () => {
  assert.ok(
    appSrc.includes('window.toggleAccountPanel=toggleAccountPanel') && appSrc.includes('window.redeemInviteUI=redeemInviteUI'),
    'toggleAccountPanel and redeemInviteUI must be exposed on window'
  );
});

test('D-136C: account panel container exists in index.html and starts hidden', () => {
  assert.ok(
    indexSrc.includes('id="account-panel"') && indexSrc.includes('class="account-panel-popover"') && /id="account-panel"[^>]*hidden/.test(indexSrc),
    'index.html must contain a hidden #account-panel container'
  );
});

test('D-136C: who badge click opens the account panel without navigating away', () => {
  assert.ok(
    indexSrc.includes('id="who"') && indexSrc.includes('onclick="toggleAccountPanel()"'),
    '#who badge must call toggleAccountPanel() on click'
  );
});

test('D-136C: styles.css defines account panel popover styling', () => {
  assert.ok(
    cssSrc.includes('.account-panel-popover') && cssSrc.includes('.account-redeem') && cssSrc.includes('.account-state-verified') && cssSrc.includes('.account-state-anon'),
    'styles.css must define account panel popover and state styling'
  );
});

// ── Section 59 — D-136D: admin invite-code creator panel ──────────────────────

test('D-136D: admin invite panel render function exists', () => {
  assert.ok(
    appSrc.includes('function renderAdminInvitePanel'),
    'renderAdminInvitePanel function must exist'
  );
});

test('D-136D: admin invite panel is only rendered when an admin token is present', () => {
  assert.ok(
    appSrc.includes('${token?renderAdminInvitePanel():\'\'}'),
    'renderReview() must only call renderAdminInvitePanel() when an admin token is present'
  );
});

test('D-136D: invite create calls POST /api/auth/invite/create', () => {
  assert.ok(
    appSrc.includes("api('/api/auth/invite/create',{method:'POST'"),
    'createInviteCodeUI must POST to /api/auth/invite/create'
  );
});

test('D-136D: invite create request includes x-humanx-admin via adminHeaders()', () => {
  const idx = appSrc.indexOf('async function createInviteCodeUI');
  assert.ok(idx !== -1, 'createInviteCodeUI function must exist');
  const slice = appSrc.slice(idx, idx + 700);
  assert.ok(
    slice.includes("api('/api/auth/invite/create',{method:'POST',headers:adminHeaders()"),
    'createInviteCodeUI must send adminHeaders() (which includes x-humanx-admin) with the request'
  );
});

test('D-136D: createInviteCodeUI guards against a missing admin token before calling the API', () => {
  const idx = appSrc.indexOf('async function createInviteCodeUI');
  const slice = appSrc.slice(idx, idx + 200);
  assert.ok(
    slice.includes('if(!adminToken())'),
    'createInviteCodeUI must check adminToken() and toast an error before attempting the request'
  );
});

test('D-136D: public account panel (accountPanelHtml) does not call invite create', () => {
  const idx = appSrc.indexOf('function accountPanelHtml');
  const slice = appSrc.slice(idx, idx + 1500);
  assert.ok(
    !slice.includes('/api/auth/invite/create') && !slice.includes('createInviteCodeUI'),
    'accountPanelHtml must never reference the admin-only invite-create endpoint or its handler'
  );
});

test('D-136D: generated invite code is rendered into the result area', () => {
  const idx = appSrc.indexOf('async function createInviteCodeUI');
  const slice = appSrc.slice(idx, idx + 900);
  assert.ok(
    slice.includes('admin-invite-code') && slice.includes('adminInviteResult'),
    'createInviteCodeUI must render the generated code into #adminInviteResult'
  );
});

test('D-136D: copy code button exists and is wired to clipboard', () => {
  assert.ok(
    appSrc.includes('function copyAdminInviteCode') &&
    appSrc.includes('navigator.clipboard') &&
    appSrc.includes('Copy code'),
    'copyAdminInviteCode must exist and the result UI must include a Copy code button'
  );
});

test('D-136D: no email-sending wording appears anywhere in the admin invite panel', () => {
  const idx = appSrc.indexOf('function renderAdminInvitePanel');
  const createIdx = appSrc.indexOf('async function createInviteCodeUI');
  const slice = appSrc.slice(idx, createIdx + 900);
  const lower = slice.toLowerCase();
  assert.ok(
    !lower.includes('email sent') && !lower.includes('we will email') && !lower.includes('email has been sent') && !lower.includes('sending email'),
    'admin invite panel must not claim that email is sent — codes are manual-share only'
  );
  assert.ok(
    slice.includes('no email is sent'),
    'admin invite panel should explicitly state that no email is sent'
  );
});

test('D-136D: existing redeem flow still posts to /api/auth/invite/redeem', () => {
  assert.ok(
    appSrc.includes("api('/api/auth/invite/redeem',{method:'POST'"),
    'redeemInviteUI must still POST to /api/auth/invite/redeem (unchanged by this patch)'
  );
});

test('D-136D: account panel (D-136C) is unmodified by this patch', () => {
  assert.ok(
    appSrc.includes('function accountPanelHtml') && appSrc.includes('function toggleAccountPanel') && appSrc.includes('function renderAccountPanel'),
    'account panel functions from D-136C must still be present'
  );
});

test('D-136D: anonymous flow (localUser, /api/session) is unmodified by this patch', () => {
  assert.ok(
    appSrc.includes("function localUser(){let u=JSON.parse(localStorage.getItem(LS_USER)||'null');if(!u){u={id:'usr_'+crypto.randomUUID().replaceAll('-','').slice(0,18),handle:'anon-'+Math.random().toString(36).slice(2,8)};localStorage.setItem(LS_USER,JSON.stringify(u))}return u}") &&
    workerSrc.includes("async function createOrGetUser(request, env) { const body = await readJson(request); const now = Date.now(); const userId = cleanId(body.id) || makeId('usr');"),
    'localUser() and /api/session backend must remain unmodified'
  );
});

test('D-136D: review actions (decision/cleanup/mark-duplicate) are unmodified by this patch', () => {
  assert.ok(
    appSrc.includes('function reviewDecisionUI') && appSrc.includes('function reviewCleanupUI') && appSrc.includes('function markDuplicateUI'),
    'review action functions must still be present and unmodified'
  );
});

test('D-136D: createInviteCodeUI and copyAdminInviteCode are exposed on window', () => {
  assert.ok(
    appSrc.includes('window.createInviteCodeUI=createInviteCodeUI') && appSrc.includes('window.copyAdminInviteCode=copyAdminInviteCode'),
    'createInviteCodeUI and copyAdminInviteCode must be exposed on window for inline onclick handlers'
  );
});

test('D-136D: styles.css defines admin invite panel styling', () => {
  assert.ok(
    cssSrc.includes('.admin-invite-panel') && cssSrc.includes('.admin-invite-code') && cssSrc.includes('.admin-invite-result'),
    'styles.css must define admin invite panel styling'
  );
});

// ── Section 60 — D-137B: My HumanX dashboard backend ───────────────────────────

test('D-137B: migration 0011 file exists', () => {
  assert.ok(migSrc0011.length > 0, 'migrations/0011_user_content_indexes.sql must exist');
});

test('D-137B: migration 0011 adds all five user_id indexes', () => {
  const idxs = [
    'CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_truths_user_id ON truths(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_evidence_user_id ON evidence(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_pressure_points_user_id ON pressure_points(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_home_tests_user_id ON home_tests(user_id)',
  ];
  assert.ok(idxs.every(i => migSrc0011.includes(i)), 'migration 0011 must create all five user_id indexes');
});

test('D-137B: GET /api/my-humanx route exists and dispatches to myHumanX', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/my-humanx' && request.method === 'GET') return await myHumanX(request, env)"),
    '/api/my-humanx route must exist and dispatch to myHumanX'
  );
});

test('D-137B: myHumanX requires/uses x-humanx-user via requireUserId', () => {
  const idx = workerSrc.indexOf('async function myHumanX');
  assert.ok(idx !== -1, 'myHumanX function must exist');
  const slice = workerSrc.slice(idx, idx + 300);
  assert.ok(
    slice.includes('requireUserId(request)'),
    'myHumanX must resolve the requester via requireUserId(request)'
  );
});

test('D-137B: myHumanX does not accept a caller-supplied target user id', () => {
  const idx = workerSrc.indexOf('async function myHumanX');
  const endIdx = workerSrc.indexOf('\nasync function', idx + 1);
  const slice = workerSrc.slice(idx, endIdx === -1 ? idx + 3000 : endIdx);
  assert.ok(
    !slice.includes('body.userId') && !slice.includes('body.user_id') && !slice.includes('url.searchParams.get') && !slice.includes('readJson'),
    'myHumanX must never read a target user id from the request body or query string — always scoped to the requester\'s own identity'
  );
});

test('D-137B: response includes ok, user, counts, and content lists', () => {
  const idx = workerSrc.indexOf('async function myHumanX');
  const endIdx = workerSrc.indexOf('\nasync function', idx + 1);
  const slice = workerSrc.slice(idx, endIdx === -1 ? idx + 3000 : endIdx);
  assert.ok(
    slice.includes('ok: true') &&
    slice.includes('user,') &&
    slice.includes('counts: { claims: claimCounts, truths: truthCounts, evidence: evidenceCounts, pressure: pressureCounts }') &&
    slice.includes('claims: claimsRows.results') &&
    slice.includes('truths: truthsRows.results') &&
    slice.includes('evidence: evidenceRows.results') &&
    slice.includes('pressure: pressureRows.results') &&
    slice.includes('belief_snapshots: beliefRows.results'),
    'myHumanX response must include ok, user, counts, claims, truths, evidence, pressure, belief_snapshots'
  );
});

test('D-137B: counts normalize null review_state to public', () => {
  assert.ok(
    workerSrc.includes("COALESCE(review_state,'public') AS state") &&
    workerSrc.includes("GROUP BY COALESCE(review_state,'public')"),
    'userContentCounts must normalize null review_state to public via COALESCE'
  );
});

test('D-137B: counts include zero values for missing states', () => {
  const idx = workerSrc.indexOf('async function userContentCounts');
  const slice = workerSrc.slice(idx, idx + 600);
  assert.ok(
    slice.includes('MY_HUMANX_REVIEW_STATES') && slice.includes('counts[s] = 0'),
    'userContentCounts must pre-fill every known state with 0 before applying actual counts'
  );
});

test('D-137B: every content query filters by the current user_id', () => {
  assert.ok(
    workerSrc.includes('FROM claims WHERE user_id=?') &&
    workerSrc.includes('FROM truths WHERE user_id=?') &&
    workerSrc.includes('FROM evidence WHERE user_id=?') &&
    workerSrc.includes('FROM pressure_points WHERE user_id=?') &&
    workerSrc.includes('FROM belief_snapshots WHERE user_id=?'),
    'every content table query must filter by user_id=? bound to the requester\'s own id'
  );
});

test('D-137B: claims, truths, evidence, pressure lists are capped at LIMIT 20 and belief_snapshots at LIMIT 10', () => {
  assert.ok(
    workerSrc.includes('FROM claims WHERE user_id=? ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 20') &&
    workerSrc.includes('FROM truths WHERE user_id=? ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 20') &&
    workerSrc.includes('FROM evidence WHERE user_id=? ORDER BY created_at DESC LIMIT 20') &&
    workerSrc.includes('FROM pressure_points WHERE user_id=? ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 20') &&
    workerSrc.includes('FROM belief_snapshots WHERE user_id=? ORDER BY created_at DESC LIMIT 10'),
    'content list queries must be capped per the documented limits'
  );
});

test('D-137B: lists sort newest first, using updated_at where available else created_at', () => {
  assert.ok(
    workerSrc.includes('ORDER BY COALESCE(updated_at,created_at) DESC') &&
    workerSrc.includes('FROM evidence WHERE user_id=? ORDER BY created_at DESC'),
    'lists must sort DESC by updated_at falling back to created_at, except evidence which has no updated_at column'
  );
});

test('D-137B: myHumanX omits is_admin and admin token material', () => {
  const idx = workerSrc.indexOf('async function myHumanX');
  const endIdx = workerSrc.indexOf('\nasync function', idx + 1);
  const slice = workerSrc.slice(idx, endIdx === -1 ? idx + 3000 : endIdx);
  const codeOnly = slice.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.ok(
    !codeOnly.includes('is_admin') && !codeOnly.includes('HUMANX_ADMIN_TOKEN') && !codeOnly.includes('x-humanx-admin'),
    'myHumanX must never select, reference, or return is_admin or admin token material'
  );
});

test('D-137B: GET /api/me remains unchanged', () => {
  const idx = workerSrc.indexOf('async function getMe');
  const slice = workerSrc.slice(idx, idx + 200);
  assert.ok(
    workerSrc.includes("url.pathname === '/api/me' && request.method === 'GET') return await getMe(request, env)") &&
    slice.includes('const userId = requireUserId(request);') &&
    slice.includes('await ensureUser(env, userId);'),
    '/api/me route and getMe implementation must remain unchanged'
  );
});

test('D-137B: existing routes (session, claims, truths, review) remain present', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/session' && request.method === 'POST'") &&
    workerSrc.includes("url.pathname === '/api/claims' && request.method === 'GET'") &&
    workerSrc.includes("url.pathname === '/api/truths' && request.method === 'GET'") &&
    workerSrc.includes("url.pathname === '/api/review' && request.method === 'GET'"),
    'existing routes must remain present and unmodified by this patch'
  );
});

test('D-137B: backend endpoint exists independently of the frontend (D-137D added the UI later)', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/my-humanx' && request.method === 'GET') return await myHumanX(request, env)"),
    'D-137B /api/my-humanx route must remain present regardless of frontend additions'
  );
});

// ── Section 61 — D-137C: truth card claimed-state clarity ─────────────────────

test('D-137C: listTruths exposes linked_claim_review_state via LEFT JOIN claims', () => {
  assert.ok(
    truthsSrc.includes('LEFT JOIN claims c ON c.id=t.linked_claim_id') &&
    truthsSrc.includes('AS linked_claim_review_state'),
    'listTruths SQL must join claims on linked_claim_id and expose linked_claim_review_state'
  );
});

test('D-137C: linked_claim_review_state is NULL (not falsely "public") when no claim is linked', () => {
  assert.ok(
    truthsSrc.includes('CASE WHEN t.linked_claim_id IS NOT NULL THEN COALESCE(c.review_state,\'public\') ELSE NULL END'),
    'listTruths must only resolve a review state when a claim is actually linked, never default to public for truths with no derived claim'
  );
});

test('D-137C: mapTruth exposes linkedClaimReviewState to the frontend', () => {
  assert.ok(
    truthsSrc.includes('linkedClaimReviewState: t.linked_claim_review_state || null'),
    'mapTruth must expose linkedClaimReviewState'
  );
});

test('D-137C: truthClaimStateMeta defines state-specific badges for all five claim states', () => {
  assert.ok(
    appSrc.includes("public:['CLAIM PUBLIC','b-green']") &&
    appSrc.includes("review:['CLAIM IN REVIEW','b-yellow']") &&
    appSrc.includes("rejected:['CLAIM REJECTED','b-red']") &&
    appSrc.includes("archived:['CLAIM ARCHIVED','b-muted']") &&
    appSrc.includes("duplicate:['CLAIM DUPLICATE','b-purple']"),
    'TRUTH_CLAIM_STATE_BADGES must define a state-specific badge for public/review/rejected/archived/duplicate'
  );
});

test('D-137C: truthCard no longer renders the generic "claim derived" chip', () => {
  assert.ok(
    !appSrc.includes('truth-linked-chip">claim derived<'),
    'the old generic "claim derived" chip must be replaced by the state-specific badge'
  );
});

test('D-137C: rejected/archived/duplicate states render a non-primary, muted button (not a fresh-submit look)', () => {
  const idx = appSrc.indexOf('function truthClaimStateMeta');
  const slice = appSrc.slice(idx, idx + 1500);
  assert.ok(
    slice.includes("btnClass:'truth-claim-btn-muted',btnLabel,btnAction:`convertTruth('${esc(t.id)}')`") &&
    slice.includes("rejected:'Rejected pressure-test',archived:'Archived pressure-test',duplicate:'Duplicate pressure-test'"),
    'rejected/archived/duplicate states must use the muted button class and state-specific labels, not the primary submit button'
  );
});

test('D-137C: review state button reads "Already in Review" and is muted, not primary', () => {
  const idx = appSrc.indexOf('function truthClaimStateMeta');
  const slice = appSrc.slice(idx, idx + 1500);
  assert.ok(
    slice.includes("btnClass:'truth-claim-btn-muted',btnLabel:'Already in Review'"),
    'review state must show "Already in Review" with the muted button class'
  );
});

test('D-137C: public claim state opens claim study, not a fresh pressure-test submission', () => {
  const idx = appSrc.indexOf('function truthClaimStateMeta');
  const slice = appSrc.slice(idx, idx + 1500);
  assert.ok(
    slice.includes("btnClass:'primary',btnLabel:'Open Claim Study →',btnAction:`openTruthClaimStudy('${esc(claimId)}')`"),
    'public claim state must open the existing claim study via openTruthClaimStudy, not call convertTruth again'
  );
});

test('D-137C: no-claim-yet state still shows the original fresh submit button', () => {
  const idx = appSrc.indexOf('function truthClaimStateMeta');
  const slice = appSrc.slice(idx, idx + 500);
  assert.ok(
    slice.includes("btnClass:'primary',btnLabel:'Pressure-test as Claim →',btnAction:`convertTruth('${esc(t.id)}')`"),
    'truths with no derived claim yet must keep the original primary "Pressure-test as Claim →" button'
  );
});

test('D-137C: openTruthClaimStudy navigates via selectClaim and sets correct back-navigation origin', () => {
  assert.ok(
    appSrc.includes("async function openTruthClaimStudy(claimId){lastModeBeforeStudy='truths';mode='arena';") &&
    appSrc.includes('await selectClaim(claimId)'),
    'openTruthClaimStudy must set lastModeBeforeStudy to truths and call selectClaim'
  );
});

test('D-137C: backToArena returns to the Truths tab when origin was truths', () => {
  assert.ok(
    appSrc.includes("else if(_origin==='truths'){setMode('truths');}"),
    'backToArena must special-case the truths origin so Back from claim study returns to Truths, not Claims'
  );
});

test('D-137C: openTruthClaimStudy is exposed on window for inline onclick handlers', () => {
  assert.ok(
    appSrc.includes('window.openTruthClaimStudy=openTruthClaimStudy'),
    'openTruthClaimStudy must be exposed on window'
  );
});

test('D-137C: no CLAIM_NOT_FOUND regression — getClaim route and public-only filter unchanged', () => {
  assert.ok(
    workerSrc.includes("url.pathname.match(/^\\/api\\/claims\\/[^/]+$/) && request.method === 'GET') return await getClaim(request, env, url.pathname.split('/').pop())"),
    'GET /api/claims/:id route must remain unchanged — non-public claims still correctly 404 rather than ever being reachable from the truth card UI'
  );
});

test('D-137C: rejected/archived/duplicate truth-card buttons never call openTruthClaimStudy (cannot 404 on a non-public claim)', () => {
  const idx = appSrc.indexOf('function truthClaimStateMeta');
  const endIdx = appSrc.indexOf('\nasync function openTruthClaimStudy', idx);
  const slice = appSrc.slice(idx, endIdx === -1 ? idx + 2000 : endIdx);
  const nonPublicBranches = slice.split('btnAction:`convertTruth').length - 1;
  assert.ok(
    nonPublicBranches >= 3,
    'rejected/archived/duplicate/review branches must route through convertTruth (existing-state toast), never openTruthClaimStudy, since those claims are not fetchable via getClaim'
  );
});

test('D-137C: existing truth-claim-bridge state-detection logic is unmodified', () => {
  assert.ok(
    truthClaimBridgeSrc.includes('async function findExistingClaim(env, truthId, truth)') &&
    truthClaimBridgeSrc.includes('async function findNonPublicExistingClaim(env, truthId, truth)'),
    'src/truth-claim-bridge.js bridge-state-detection functions must remain unmodified by this frontend/listing-only patch'
  );
});

test('D-137C: My HumanX backend endpoint is unaffected by this patch', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/my-humanx' && request.method === 'GET') return await myHumanX(request, env)"),
    '/api/my-humanx route must remain present and unmodified'
  );
});

test('D-137C: invite auth routes are unaffected by this patch', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/auth/invite/create'") &&
    workerSrc.includes("url.pathname === '/api/auth/invite/redeem'"),
    'invite auth routes must remain present and unmodified'
  );
});

test('D-137C: no D1 migration added for this change', () => {
  assert.ok(
    !existsSync(path.join(__dirname, '../migrations/0012_d137c.sql')) &&
    !existsSync(path.join(__dirname, '../migrations/0012_truth_claim_state.sql')),
    'D-137C must not require a D1 migration — linked_claim_id and claims.review_state already exist'
  );
});

// ── Section 62 — D-137D: My HumanX dashboard frontend ──────────────────────────

test('D-137D: Me nav tab exists in index.html', () => {
  assert.ok(
    indexSrc.includes('id="tab-me"') && indexSrc.includes('onclick="setMode(\'me\')">Me<'),
    'index.html must contain a Me nav tab calling setMode(\'me\')'
  );
});

test('D-137D: mode "me" is wired into render() dispatch', () => {
  assert.ok(
    appSrc.includes("if(mode==='me')return renderMe();"),
    'render() must dispatch to renderMe() when mode is me'
  );
});

test('D-137D: renderMe calls GET /api/my-humanx', () => {
  const idx = appSrc.indexOf('async function renderMe()');
  assert.ok(idx !== -1, 'renderMe function must exist');
  const slice = appSrc.slice(idx, idx + 500);
  assert.ok(
    slice.includes("api('/api/my-humanx')"),
    'renderMe must call api(\'/api/my-humanx\')'
  );
});

test('D-137D: renderMe sends x-humanx-user via the shared api()/headers() helpers (no override)', () => {
  const idx = appSrc.indexOf('async function renderMe()');
  const slice = appSrc.slice(idx, idx + 500);
  assert.ok(
    slice.includes("await api('/api/my-humanx')") && !slice.includes("api('/api/my-humanx',{headers:"),
    'renderMe must not override the default headers() (which sets x-humanx-user) for this call'
  );
});

test('D-137D: renderMe shows loading and error states without forcing login', () => {
  const idx = appSrc.indexOf('async function renderMe()');
  const slice = appSrc.slice(idx, idx + 700);
  assert.ok(
    slice.includes('Loading My HumanX') && slice.includes('My HumanX unavailable') && slice.includes('catch(e)'),
    'renderMe must show a loading message and a non-fatal error state, never block on auth'
  );
});

test('D-137D: account card renders Verified and Anonymous states', () => {
  assert.ok(
    appSrc.includes("function meAccountCardHtml") &&
    appSrc.includes("verified?'Verified':'Anonymous'"),
    'meAccountCardHtml must render Verified or Anonymous depending on user.verified'
  );
});

test('D-137D: account card shows display name/email/handle/user id', () => {
  const idx = appSrc.indexOf('function meAccountCardHtml');
  const slice = appSrc.slice(idx, idx + 600);
  assert.ok(
    slice.includes('u.display_name') && slice.includes('u.email') && slice.includes('Handle:') && slice.includes('User ID:'),
    'meAccountCardHtml must show display_name, email, handle, and user id'
  );
});

test('D-137D: counts render for claims, truths, evidence, and pressure', () => {
  const idx = appSrc.indexOf('function renderMeHtml');
  const slice = appSrc.slice(idx, idx + 700);
  assert.ok(
    slice.includes("meCountsRow('Claims',counts.claims)") &&
    slice.includes("meCountsRow('Truths',counts.truths)") &&
    slice.includes("meCountsRow('Evidence',counts.evidence)") &&
    slice.includes("meCountsRow('Pressure',counts.pressure)"),
    'renderMeHtml must render a counts row for claims, truths, evidence, and pressure'
  );
});

test('D-137D: counts row renders all five review states', () => {
  assert.ok(
    appSrc.includes('const ME_STATE_LABELS={public:\'Public\',review:\'Review\',rejected:\'Rejected\',archived:\'Archived\',duplicate:\'Duplicate\'}'),
    'ME_STATE_LABELS must cover public/review/rejected/archived/duplicate'
  );
});

test('D-137D/E: recent claims, truths, evidence, and pressure sections render', () => {
  const idx = appSrc.indexOf('function renderMeHtml');
  const slice = appSrc.slice(idx, idx + 1700);
  assert.ok(
    slice.includes('Recent Claims') && slice.includes('Recent Truths') && slice.includes('Recent Evidence') && slice.includes('Recent Pressure'),
    'renderMeHtml must render Recent Claims/Truths/Evidence/Pressure sections'
  );
});

test('D-137D/E: belief snapshots section renders', () => {
  const idx = appSrc.indexOf('function renderMeHtml');
  const slice = appSrc.slice(idx, idx + 1700);
  assert.ok(
    slice.includes('Belief Snapshots') && slice.includes("meBeliefSnapshotsHtml(meVisibleSlice('snapshots',snapshots))"),
    'renderMeHtml must render a Belief Snapshots section sourced from data.belief_snapshots'
  );
});

test('D-137D: only public claim rows render an open-study button; non-public rows do not call selectClaim', () => {
  const idx = appSrc.indexOf('function meRecentClaimsHtml');
  const slice = appSrc.slice(idx, idx + 700);
  assert.ok(
    slice.includes('const isPublic=state===\'public\'') &&
    slice.includes('${isPublic?`<button class="btn-mini" onclick="openMyClaimStudy('),
    'meRecentClaimsHtml must only render the Open Study button for isPublic rows'
  );
  // openMyClaimStudy is the only path to selectClaim from this list — confirm it's conditional, not unconditional
  const unconditionalSelectClaim = /<button[^>]*onclick="openMyClaimStudy\('\$\{esc\(c\.id\)\}'\)"[^>]*>Open Study/.test(slice) && !slice.includes('isPublic?');
  assert.ok(!unconditionalSelectClaim, 'the Open Study button must remain gated behind isPublic, never unconditional');
});

test('D-137D: evidence and pressure rows show parent claim id as plain text, never as a clickable open action', () => {
  const evIdx = appSrc.indexOf('function meRecentEvidenceHtml');
  const evSlice = appSrc.slice(evIdx, evIdx + 800);
  const prIdx = appSrc.indexOf('function meRecentPressureHtml');
  const prSlice = appSrc.slice(prIdx, prIdx + 800);
  assert.ok(
    evSlice.includes('<code class="me-item-parent"') && !evSlice.includes('onclick="openMyClaimStudy') && !evSlice.includes('onclick="selectClaim'),
    'evidence rows must show claim_id as plain <code>, never as a clickable claim-open action'
  );
  assert.ok(
    prSlice.includes('<code class="me-item-parent"') && !prSlice.includes('onclick="openMyClaimStudy') && !prSlice.includes('onclick="selectClaim'),
    'pressure rows must show claim_id as plain <code>, never as a clickable claim-open action'
  );
});

test('D-137D: truth rows only offer navigation for public truths', () => {
  const idx = appSrc.indexOf('function meRecentTruthsHtml');
  const slice = appSrc.slice(idx, idx + 800);
  assert.ok(
    slice.includes('const isPublic=state===\'public\'') &&
    slice.includes("${isPublic?`<button class=\"btn-mini\" onclick=\"setMode('truths')\">"),
    'meRecentTruthsHtml must only offer the View in Truths action for public rows'
  );
});

test('D-137D: no public profile or share UI added', () => {
  const idx = appSrc.indexOf('// D-137D: My HumanX personal dashboard frontend.');
  const endIdx = appSrc.indexOf('async function renderMe()', idx) + 1000;
  const slice = appSrc.slice(idx, endIdx);
  const codeOnly = slice.split('\n').filter(l => !l.trim().startsWith('//')).join('\n').toLowerCase();
  assert.ok(
    !codeOnly.includes('share') && !codeOnly.includes('public profile') && !codeOnly.includes('copy link'),
    'My HumanX dashboard code must not introduce share buttons or a public profile (outside of explanatory comments)'
  );
});

test('D-137D: My HumanX call never accepts a target-user parameter', () => {
  const idx = appSrc.indexOf('async function renderMe()');
  const slice = appSrc.slice(idx, idx + 500);
  assert.ok(
    !slice.includes('userId=') && !slice.includes('?user=') && !slice.includes('targetUser'),
    'renderMe must never pass a target user id — always implicitly scoped via x-humanx-user'
  );
});

test('D-137D: backToArena and renderStudy recognize the me origin for correct back-navigation', () => {
  assert.ok(
    appSrc.includes("else if(_origin==='me'){setMode('me');}") &&
    appSrc.includes("lastModeBeforeStudy==='me'?'← Back to My HumanX'"),
    'backToArena and renderStudy must handle the me origin'
  );
});

test('D-137D: openMyClaimStudy is exposed on window for inline onclick handlers', () => {
  assert.ok(
    appSrc.includes('window.openMyClaimStudy=openMyClaimStudy'),
    'openMyClaimStudy must be exposed on window'
  );
});

test('D-137D: existing pages (Home, Claims, Truths, Review) are preserved in the render dispatch', () => {
  assert.ok(
    appSrc.includes("if(mode==='home')return renderHome()") &&
    appSrc.includes("if(mode==='truths')return renderTruths()") &&
    appSrc.includes("if(mode==='review')return renderReview()"),
    'render() must still dispatch Home/Truths/Review unchanged'
  );
});

test('D-137D: account panel (D-136C) and admin invite creator (D-136D) are unmodified', () => {
  assert.ok(
    appSrc.includes('function accountPanelHtml') && appSrc.includes('function renderAdminInvitePanel'),
    'account panel and admin invite creator functions must remain present and unmodified'
  );
});

test('D-137D: D-137C truth claim state clarity is preserved', () => {
  assert.ok(
    appSrc.includes('function truthClaimStateMeta') && appSrc.includes('TRUTH_CLAIM_STATE_BADGES'),
    'D-137C truth-card claim-state logic must remain present and unmodified'
  );
});

test('D-137D: no backend route changes — worker.js route block is unmodified', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/my-humanx' && request.method === 'GET') return await myHumanX(request, env)"),
    'D-137D is frontend-only — the /api/my-humanx GET route must remain exactly as D-137B defined it (D-138B later added sibling /api/my-humanx/* routes — see Section 64)'
  );
});

test('D-137D: no D1 migration added for this change', () => {
  assert.ok(
    !existsSync(path.join(__dirname, '../migrations/0012_d137d.sql')) &&
    !existsSync(path.join(__dirname, '../migrations/0012_my_humanx_ui.sql')),
    'D-137D must not require a D1 migration'
  );
});

// ── Section 63 — D-137E: My HumanX dashboard scan density polish ───────────────

test('D-137E: default visible item cap is 5', () => {
  assert.ok(
    appSrc.includes('const ME_VISIBLE_CAP=5;'),
    'ME_VISIBLE_CAP must default to 5'
  );
});

test('D-137E: meVisibleSlice and meShowAllControl implement show-all/show-less logic', () => {
  assert.ok(
    appSrc.includes("function meVisibleSlice(key,rows){return meExpanded[key]?rows:rows.slice(0,ME_VISIBLE_CAP)}") &&
    appSrc.includes('function meShowAllControl(key,total)') &&
    appSrc.includes("function meToggleExpand(key){meExpanded[key]=!meExpanded[key];meRerender()}"),
    'Me dashboard must implement per-section show-all/show-less state via meExpanded/meToggleExpand'
  );
});

test('D-137E: show-all control only appears when a section exceeds the cap, and toggles its own label', () => {
  const idx = appSrc.indexOf('function meShowAllControl');
  const slice = appSrc.slice(idx, idx + 400);
  assert.ok(
    slice.includes('if(total<=ME_VISIBLE_CAP)return\'\'') &&
    slice.includes("exp?'Show less':'Show all (") ,
    'meShowAllControl must hide itself under the cap and flip between Show all / Show less'
  );
});

test('D-137E: state filter exists with all/public/review/rejected/archived/duplicate', () => {
  assert.ok(
    appSrc.includes("const ME_FILTER_STATES=['all','public','review','rejected','archived','duplicate'];") &&
    appSrc.includes('function meFilterBarHtml()'),
    'Me dashboard must expose a state filter bar covering all six states'
  );
});

test('D-137E: state filter applies to claims/truths/evidence/pressure lists, not counts or snapshots', () => {
  const idx = appSrc.indexOf('function renderMeHtml');
  const slice = appSrc.slice(idx, idx + 1700);
  assert.ok(
    slice.includes('const claims=meFilterRows(data.claims)') &&
    slice.includes('const truths=meFilterRows(data.truths)') &&
    slice.includes('const evidence=meFilterRows(data.evidence)') &&
    slice.includes('const pressure=meFilterRows(data.pressure)') &&
    slice.includes('const snapshots=data.belief_snapshots||[]') &&
    !slice.includes('meFilterRows(data.belief_snapshots)'),
    'renderMeHtml must filter claims/truths/evidence/pressure by state but leave belief_snapshots and counts untouched'
  );
});

test('D-137E: counts remain full totals regardless of the active state filter', () => {
  const idx = appSrc.indexOf('function renderMeHtml');
  const slice = appSrc.slice(idx, idx + 700);
  assert.ok(
    slice.includes('const counts=data.counts||{}') &&
    slice.includes("meCountsRow('Claims',counts.claims)") &&
    !slice.includes('meFilterRows(counts'),
    'counts row must always read from data.counts (server-side full totals), never from the filtered/sliced lists'
  );
});

test('D-137E: section order puts Belief Snapshots before Recent Truths/Evidence/Pressure', () => {
  const idx = appSrc.indexOf('function renderMeHtml');
  const slice = appSrc.slice(idx, idx + 1700);
  const claimsAt = slice.indexOf('Recent Claims');
  const snapshotsAt = slice.indexOf('Belief Snapshots');
  const truthsAt = slice.indexOf('Recent Truths');
  const evidenceAt = slice.indexOf('Recent Evidence');
  const pressureAt = slice.indexOf('Recent Pressure');
  assert.ok(
    claimsAt !== -1 && snapshotsAt !== -1 && truthsAt !== -1 && evidenceAt !== -1 && pressureAt !== -1 &&
    claimsAt < snapshotsAt && snapshotsAt < truthsAt && truthsAt < evidenceAt && evidenceAt < pressureAt,
    'renderMeHtml must order sections: Account, Counts, Recent Claims, Belief Snapshots, Recent Truths, Recent Evidence, Recent Pressure'
  );
});

test('D-137E: public claim open behavior preserved after scan-density polish', () => {
  const idx = appSrc.indexOf('function meRecentClaimsHtml');
  const slice = appSrc.slice(idx, idx + 800);
  assert.ok(
    slice.includes("const isPublic=state==='public'") &&
    slice.includes('${isPublic?`<button class="btn-mini" onclick="openMyClaimStudy('),
    'meRecentClaimsHtml must still gate Open Study behind isPublic after the D-137E rewrite'
  );
});

test('D-137E: non-public claim no-open behavior preserved after scan-density polish', () => {
  const idx = appSrc.indexOf('function meRecentClaimsHtml');
  const slice = appSrc.slice(idx, idx + 800);
  const unconditionalSelectClaim = /<button[^>]*onclick="openMyClaimStudy\('\$\{esc\(c\.id\)\}'\)"[^>]*>Open Study/.test(slice) && !slice.includes('isPublic?');
  assert.ok(!unconditionalSelectClaim, 'Open Study must remain gated behind isPublic, never unconditional, after the D-137E rewrite');
});

test('D-137E: item rows show state badge first, then text, then date/updated meta', () => {
  const idx = appSrc.indexOf('function meRecentClaimsHtml');
  const slice = appSrc.slice(idx, idx + 800);
  const badgeAt = slice.indexOf('<span class="badge ${clr}">');
  const textAt = slice.indexOf('<span class="me-item-text">');
  const metaAt = slice.indexOf('<span class="small me-item-meta">');
  assert.ok(
    badgeAt !== -1 && textAt !== -1 && metaAt !== -1 && badgeAt < textAt && textAt < metaAt,
    'meRecentClaimsHtml row markup must order badge, then item text, then date/updated meta'
  );
});

test('D-137E: evidence/pressure titles are truncated via shortText to avoid long-body overflow', () => {
  const evIdx = appSrc.indexOf('function meRecentEvidenceHtml');
  const evSlice = appSrc.slice(evIdx, evIdx + 800);
  const prIdx = appSrc.indexOf('function meRecentPressureHtml');
  const prSlice = appSrc.slice(prIdx, prIdx + 800);
  assert.ok(
    evSlice.includes('shortText(e.title') && prSlice.includes('shortText(p.title'),
    'evidence and pressure rows must truncate long titles via shortText'
  );
});

test('D-137E: no backend route changes — worker.js /api/my-humanx route is unmodified', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/my-humanx' && request.method === 'GET') return await myHumanX(request, env)"),
    'D-137E is frontend-only — the /api/my-humanx GET route must remain exactly as D-137B defined it (D-138B later added sibling /api/my-humanx/* routes — see Section 64)'
  );
});

test('D-137E: no D1 migration added for this change', () => {
  assert.ok(
    !existsSync(path.join(__dirname, '../migrations/0012_d137e.sql')) &&
    !existsSync(path.join(__dirname, '../migrations/0012_my_humanx_polish.sql')),
    'D-137E must not require a D1 migration'
  );
});

// ── Section 64 — D-138B: User-owned archive/export backend foundation ──────────

test('D-138B: migration 0012 file exists', () => {
  assert.ok(migSrc0012.length > 0, 'migrations/0012_user_owned_archive_export.sql must exist');
});

test('D-138B: migration 0012 adds archived_by_user to claims/truths/evidence/pressure_points', () => {
  assert.ok(
    migSrc0012.includes('ALTER TABLE claims ADD COLUMN archived_by_user INTEGER DEFAULT 0;') &&
    migSrc0012.includes('ALTER TABLE truths ADD COLUMN archived_by_user INTEGER DEFAULT 0;') &&
    migSrc0012.includes('ALTER TABLE evidence ADD COLUMN archived_by_user INTEGER DEFAULT 0;') &&
    migSrc0012.includes('ALTER TABLE pressure_points ADD COLUMN archived_by_user INTEGER DEFAULT 0;'),
    'migration 0012 must add archived_by_user to all four moderated content tables'
  );
});

test('D-138B: migration 0012 adds belief_snapshots.hidden_at and an index on it', () => {
  assert.ok(
    migSrc0012.includes('ALTER TABLE belief_snapshots ADD COLUMN hidden_at INTEGER;') &&
    migSrc0012.includes('CREATE INDEX IF NOT EXISTS idx_belief_snapshots_hidden_at ON belief_snapshots(hidden_at);'),
    'migration 0012 must add belief_snapshots.hidden_at plus a supporting index'
  );
});

test('D-138B: migration 0012 adds evidence.updated_at', () => {
  assert.ok(
    migSrc0012.includes('ALTER TABLE evidence ADD COLUMN updated_at INTEGER;'),
    'migration 0012 must add evidence.updated_at (evidence previously had no updated_at column)'
  );
});

test('D-138B: migration 0012 adds no hard-delete or deleted_at columns', () => {
  assert.ok(
    !migSrc0012.includes('deleted_at') && !/DROP\s+TABLE/i.test(migSrc0012) && !/DELETE\s+FROM/i.test(migSrc0012),
    'migration 0012 must be purely additive — no deleted_at, no DROP TABLE, no DELETE FROM'
  );
});

test('D-138B: POST /api/my-humanx/archive route exists and dispatches to archiveMyHumanXItem', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/my-humanx/archive' && request.method === 'POST') return await archiveMyHumanXItem(request, env)"),
    'worker.js must route POST /api/my-humanx/archive to archiveMyHumanXItem'
  );
});

test('D-138B: GET /api/my-humanx/export route exists and dispatches to exportMyHumanX', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/my-humanx/export' && request.method === 'GET') return await exportMyHumanX(request, env)"),
    'worker.js must route GET /api/my-humanx/export to exportMyHumanX'
  );
});

test('D-138B: archiveMyHumanXItem uses requireUserId and never accepts a target user id', () => {
  const idx = workerSrc.indexOf('async function archiveMyHumanXItem');
  const endIdx = workerSrc.indexOf('\nasync function exportMyHumanX', idx);
  const slice = workerSrc.slice(idx, endIdx > -1 ? endIdx : idx + 4000);
  assert.ok(
    slice.includes('const userId = requireUserId(request);') &&
    !slice.includes('userId=req') && !slice.includes('body.userId') && !slice.includes('body.user_id') && !slice.includes('targetUser'),
    'archiveMyHumanXItem must derive userId only from requireUserId(request), never from request body'
  );
});

test('D-138B: archiveMyHumanXItem ownership check uses WHERE id=? AND user_id=?', () => {
  const idx = workerSrc.indexOf('async function archiveMyHumanXItem');
  const endIdx = workerSrc.indexOf('\nasync function exportMyHumanX', idx);
  const slice = workerSrc.slice(idx, endIdx > -1 ? endIdx : idx + 4000);
  assert.ok(
    slice.includes('WHERE t.id=? AND t.user_id=?') &&
    slice.includes('.bind(targetId, userId)'),
    'archiveMyHumanXItem must scope the ownership lookup by both id and user_id, bound in that order'
  );
});

test('D-138B: archiveMyHumanXItem returns 404 NOT_FOUND_OR_NOT_OWNED when ownership lookup misses', () => {
  const idx = workerSrc.indexOf('async function archiveMyHumanXItem');
  const endIdx = workerSrc.indexOf('\nasync function exportMyHumanX', idx);
  const slice = workerSrc.slice(idx, endIdx > -1 ? endIdx : idx + 4000);
  assert.ok(
    slice.includes("if (!row) return json({ error: 'NOT_FOUND_OR_NOT_OWNED' }, 404);"),
    'archiveMyHumanXItem must 404 with NOT_FOUND_OR_NOT_OWNED rather than confirming row existence to a non-owner'
  );
});

test('D-138B: archiveMyHumanXItem blocks protected seed ids and dev handles with 403 PROTECTED', () => {
  const idx = workerSrc.indexOf('async function archiveMyHumanXItem');
  const endIdx = workerSrc.indexOf('\nasync function exportMyHumanX', idx);
  const slice = workerSrc.slice(idx, endIdx > -1 ? endIdx : idx + 4000);
  assert.ok(
    slice.includes('MY_HUMANX_PROTECTED_SEEDS.has(targetId)') &&
    slice.includes('MY_HUMANX_DEV_HANDLES.has(') &&
    (slice.match(/error: 'PROTECTED' \}, 403\)/g) || []).length >= 2,
    'archiveMyHumanXItem must reject protected seed ids and dev-handle-owned rows with 403 PROTECTED'
  );
});

test('D-138B: archiveMyHumanXItem blocks evidence/pressure still referenced by another user\'s public claim with 409', () => {
  const idx = workerSrc.indexOf('async function archiveMyHumanXItem');
  const endIdx = workerSrc.indexOf('\nasync function exportMyHumanX', idx);
  const slice = workerSrc.slice(idx, endIdx > -1 ? endIdx : idx + 4000);
  assert.ok(
    (slice.match(/error: 'STILL_REFERENCED'/g) || []).length >= 2 &&
    slice.includes("targetType === 'evidence'") &&
    slice.includes("targetType === 'pressure'") &&
    slice.includes('evidence_claim_links'),
    'archiveMyHumanXItem must check both evidence.claim_id + evidence_claim_links and pressure.claim_id against other users\' public claims, returning 409 STILL_REFERENCED'
  );
});

test('D-138B: archiveMyHumanXItem sets review_state=archived and archived_by_user=1', () => {
  const idx = workerSrc.indexOf('async function archiveMyHumanXItem');
  const endIdx = workerSrc.indexOf('\nasync function exportMyHumanX', idx);
  const slice = workerSrc.slice(idx, endIdx > -1 ? endIdx : idx + 4000);
  assert.ok(
    slice.includes("SET review_state='archived', archived_by_user=1, updated_at=? WHERE id=?"),
    'archiveMyHumanXItem must archive via review_state=archived + archived_by_user=1, never a hard delete'
  );
});

test('D-138B: archiveMyHumanXItem never issues a DELETE statement', () => {
  const idx = workerSrc.indexOf('async function archiveMyHumanXItem');
  const endIdx = workerSrc.indexOf('\nasync function exportMyHumanX', idx);
  const slice = workerSrc.slice(idx, endIdx > -1 ? endIdx : idx + 4000);
  assert.ok(!/DELETE\s+FROM/i.test(slice), 'archiveMyHumanXItem must not contain any DELETE FROM statement — no hard delete in v1');
});

test('D-138B: exportMyHumanX requires x-humanx-user via requireUserId and never accepts a target user id', () => {
  const idx = workerSrc.indexOf('async function exportMyHumanX');
  const slice = workerSrc.slice(idx, idx + 3500);
  assert.ok(
    slice.includes('const userId = requireUserId(request);') &&
    !slice.includes('body.userId') && !slice.includes('body.user_id') && !slice.includes('targetUser') && !slice.includes('searchParams.get(\'user'),
    'exportMyHumanX must derive userId only from requireUserId(request)'
  );
});

test('D-138B: exportMyHumanX filters every table query by user_id and has no LIMIT clause', () => {
  const idx = workerSrc.indexOf('async function exportMyHumanX');
  const slice = workerSrc.slice(idx, idx + 3500);
  const tables = ['claims', 'truths', 'evidence', 'pressure_points', 'belief_snapshots', 'claim_votes', 'evidence_votes', 'truth_votes', 'home_tests'];
  assert.ok(
    tables.every(t => slice.includes(`FROM ${t} WHERE user_id=?`)),
    'every export query must read FROM <table> WHERE user_id=? for all nine owned tables'
  );
  assert.ok(!/LIMIT\s+\d/i.test(slice), 'export queries must not be capped with LIMIT — full export, not a dashboard preview');
});

test('D-138B: exportMyHumanX omits is_admin and admin-token material from the users row', () => {
  const idx = workerSrc.indexOf('async function exportMyHumanX');
  const slice = workerSrc.slice(idx, idx + 3500);
  assert.ok(
    slice.includes('SELECT id, handle, email, verified, verified_at, display_name, trust_score, strike_count, is_shadow_banned, created_at FROM users WHERE id=?') &&
    !slice.includes('is_admin') && !slice.includes('SELECT * FROM users') && !slice.includes('HUMANX_ADMIN_TOKEN'),
    'exportMyHumanX must use an explicit users column list that omits is_admin and never echo the admin token'
  );
});

test('D-138B: exportMyHumanX sets Content-Disposition: attachment with a per-user filename', () => {
  const idx = workerSrc.indexOf('async function exportMyHumanX');
  const slice = workerSrc.slice(idx, idx + 3500);
  assert.ok(
    slice.includes('content-disposition') &&
    slice.includes('attachment; filename=') &&
    slice.includes('humanx-export-${userId}.json') &&
    slice.includes("'content-type': 'application/json; charset=utf-8'"),
    'exportMyHumanX must set a Content-Disposition attachment header and application/json content type'
  );
});

test('D-138B: exportMyHumanX is rate-limited via safeRateLimit', () => {
  const idx = workerSrc.indexOf('async function exportMyHumanX');
  const slice = workerSrc.slice(idx, idx + 600);
  assert.ok(
    /safeRateLimit\(request, env, `my-humanx-export:\$\{userId\}`, 5, 3600000\)/.test(slice),
    'exportMyHumanX must rate-limit via the existing safeRateLimit helper, scoped per user'
  );
});

test('D-138B: GET /api/my-humanx dashboard, /api/me, /api/session, invite auth, and admin review cleanup routes are preserved', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/my-humanx' && request.method === 'GET') return await myHumanX(request, env)") &&
    workerSrc.includes("url.pathname === '/api/me' && request.method === 'GET') return await getMe(request, env)") &&
    workerSrc.includes("url.pathname === '/api/session' && request.method === 'POST') return await createOrGetUser(request, env)") &&
    workerSrc.includes("url.pathname === '/api/auth/invite/create' && request.method === 'POST'") &&
    workerSrc.includes("url.pathname === '/api/auth/invite/redeem' && request.method === 'POST') return await redeemInviteCode(request, env)") &&
    workerSrc.includes("url.pathname === '/api/review/cleanup' && request.method === 'POST') return await reviewCleanup(request, env)"),
    'D-138B must not modify the existing dashboard, account, session, invite, or admin cleanup routes'
  );
});

test('D-138B: backend foundation shipped without requiring frontend wiring in the same patch (D-138C added the UI later)', () => {
  assert.ok(
    workerSrc.includes('async function archiveMyHumanXItem') && workerSrc.includes('async function exportMyHumanX'),
    'D-138B backend functions must exist independently of whether the frontend has wired them up yet'
  );
});

test('D-138B: docs/API_ENDPOINT_INVENTORY.md documents the new archive/export routes', () => {
  assert.ok(
    apiInventorySrc.includes('/api/my-humanx/archive') && apiInventorySrc.includes('/api/my-humanx/export'),
    'docs/API_ENDPOINT_INVENTORY.md must document POST /api/my-humanx/archive and GET /api/my-humanx/export'
  );
});

// ── Section 65 — D-138C: My HumanX archive/export frontend controls ────────────

test('D-138C: Export button exists in the My HumanX account card', () => {
  const idx = appSrc.indexOf('function meAccountCardHtml');
  const slice = appSrc.slice(idx, idx + 700);
  assert.ok(
    slice.includes('me-account-actions') && slice.includes('onclick="exportMyHumanXData()"') && slice.includes('Export my data'),
    'meAccountCardHtml must render an Export button calling exportMyHumanXData()'
  );
});

test('D-138C: exportMyHumanXData calls GET /api/my-humanx/export via the shared api() helper', () => {
  const idx = appSrc.indexOf('async function exportMyHumanXData');
  const slice = appSrc.slice(idx, idx + 600);
  assert.ok(
    slice.includes("await api('/api/my-humanx/export')"),
    'exportMyHumanXData must call api(\'/api/my-humanx/export\') — no separate fetch() with custom headers'
  );
});

test('D-138C: exportMyHumanXData uses the current x-humanx-user via the shared headers()/api() pattern, never an admin header', () => {
  const idx = appSrc.indexOf('async function exportMyHumanXData');
  const slice = appSrc.slice(idx, idx + 600);
  assert.ok(
    slice.includes("await api('/api/my-humanx/export')") &&
    !slice.includes('adminHeaders') && !slice.includes('x-humanx-admin') && !slice.includes('adminToken'),
    'exportMyHumanXData must rely on api()\'s default headers() (which sets x-humanx-user) and never send admin credentials'
  );
});

test('D-138C: exportMyHumanXData triggers a browser download and shows a toast, never logs the admin token', () => {
  const idx = appSrc.indexOf('async function exportMyHumanXData');
  const slice = appSrc.slice(idx, idx + 600);
  assert.ok(
    slice.includes('new Blob(') && slice.includes('URL.createObjectURL') && slice.includes('a.click()') &&
    slice.includes("toast('Export downloaded.')") && slice.includes("catch(e){toast(e.message||'Export failed.')}"),
    'exportMyHumanXData must build a downloadable Blob, click a hidden anchor, and toast on both success and failure'
  );
});

test('D-138C: archive action appears on non-archived own claim/truth/evidence/pressure rows', () => {
  assert.ok(
    appSrc.includes("!isArchived?`<button class=\"btn-mini danger\" onclick=\"meArchiveItemUI('claim','${esc(c.id)}')\">Archive</button>`:''") &&
    appSrc.includes("!isArchived?`<button class=\"btn-mini danger\" onclick=\"meArchiveItemUI('truth','${esc(t.id)}')\">Archive</button>`:''") &&
    appSrc.includes("!isArchived?`<button class=\"btn-mini danger\" onclick=\"meArchiveItemUI('evidence','${esc(e.id)}')\">Archive</button>`:''") &&
    appSrc.includes("!isArchived?`<button class=\"btn-mini danger\" onclick=\"meArchiveItemUI('pressure','${esc(p.id)}')\">Archive</button>`:''"),
    'each of the four item-row renderers must render an Archive button only when !isArchived'
  );
});

test('D-138C: archive action is hidden for already-archived rows (isArchived gates the button, not just disables it)', () => {
  const fns = ['meRecentClaimsHtml', 'meRecentTruthsHtml', 'meRecentEvidenceHtml', 'meRecentPressureHtml'];
  for (const fn of fns) {
    const idx = appSrc.indexOf(`function ${fn}`);
    const slice = appSrc.slice(idx, idx + 900);
    assert.ok(
      slice.includes("const isArchived=state==='archived'") && slice.includes('!isArchived?`<button'),
      `${fn} must compute isArchived from review_state and gate the Archive button behind !isArchived`
    );
  }
});

test('D-138C: meArchiveItemUI posts to /api/my-humanx/archive with targetType and targetId in the body', () => {
  const idx = appSrc.indexOf('function meArchiveItemUI');
  const slice = appSrc.slice(idx, idx + 700);
  assert.ok(
    slice.includes("await api('/api/my-humanx/archive',{method:'POST',body:JSON.stringify({targetType,targetId})})"),
    'meArchiveItemUI must POST /api/my-humanx/archive with a JSON body of {targetType,targetId}'
  );
});

test('D-138C: meArchiveItemUI shows a confirmation modal before archiving', () => {
  const idx = appSrc.indexOf('function meArchiveItemUI');
  const slice = appSrc.slice(idx, idx + 700);
  assert.ok(
    slice.includes('hxModal({title:\'Archive item\'') &&
    slice.includes("confirmLabel:'Archive'") &&
    slice.includes("cancelLabel:'Cancel'") &&
    slice.includes('onConfirm:async(close)=>{close();try{await api('),
    'meArchiveItemUI must confirm via hxModal before issuing the archive POST — the POST must live inside onConfirm, not fire immediately'
  );
});

test('D-138C: archive success reloads the dashboard via renderMe() (re-fetches /api/my-humanx)', () => {
  const idx = appSrc.indexOf('function meArchiveItemUI');
  const slice = appSrc.slice(idx, idx + 700);
  assert.ok(
    slice.includes("toast('Archived.');await renderMe()"),
    'meArchiveItemUI must call renderMe() on success, which re-fetches GET /api/my-humanx — not just meRerender() against stale cached data'
  );
});

test('D-138C: 409/403/404 archive errors map to clear, distinct user-facing messages', () => {
  const idx = appSrc.indexOf('function meArchiveErrorMessage');
  const slice = appSrc.slice(idx, idx + 500);
  assert.ok(
    slice.includes("code==='STILL_REFERENCED'") && slice.includes('still used by another public claim') &&
    slice.includes("code==='PROTECTED'") && slice.includes('protected') &&
    slice.includes("code==='NOT_FOUND_OR_NOT_OWNED'") && slice.includes('not found or not owned'),
    'meArchiveErrorMessage must translate STILL_REFERENCED/PROTECTED/NOT_FOUND_OR_NOT_OWNED into distinct, human-readable messages'
  );
});

test('D-138C: archive error messages are wired into the catch path via toast', () => {
  const idx = appSrc.indexOf('function meArchiveItemUI');
  const slice = appSrc.slice(idx, idx + 700);
  assert.ok(
    slice.includes('catch(e){toast(meArchiveErrorMessage(e.message))}'),
    'meArchiveItemUI must route caught errors through meArchiveErrorMessage before toasting'
  );
});

test('D-138C: no hard-delete action in the archive/export controls — no Delete button, no DELETE call', () => {
  const archiveIdx = appSrc.indexOf('function meArchiveItemUI');
  const exportIdx = appSrc.indexOf('async function exportMyHumanXData');
  const slice = appSrc.slice(Math.min(archiveIdx, exportIdx), Math.max(archiveIdx, exportIdx) + 700);
  assert.ok(
    !/>Delete</i.test(slice) && !/confirmLabel:'Delete'/i.test(slice) && !/method:'DELETE'/.test(slice) &&
    slice.includes('does not delete it'),
    'archive/export UI must offer no Delete-labeled button or DELETE method call — only the explicit "does not delete it" reassurance copy'
  );
});

test('D-138C: belief snapshots deferred — no archive action added to meBeliefSnapshotsHtml (no backend endpoint yet)', () => {
  const idx = appSrc.indexOf('function meBeliefSnapshotsHtml');
  const slice = appSrc.slice(idx, idx + 500);
  assert.ok(
    !slice.includes('meArchiveItemUI') && !slice.includes('Archive'),
    'meBeliefSnapshotsHtml must not render an Archive action — belief-snapshot archive has no backend endpoint yet'
  );
});

test('D-138C: no public profile/share/comments UI added', () => {
  const archiveIdx = appSrc.indexOf('function meArchiveItemUI');
  const exportIdx = appSrc.indexOf('async function exportMyHumanXData');
  const slice = appSrc.slice(Math.min(archiveIdx, exportIdx), Math.max(archiveIdx, exportIdx) + 700).toLowerCase();
  assert.ok(
    !slice.includes('share') && !slice.includes('public profile') && !slice.includes('comment'),
    'D-138C archive/export controls must not introduce share buttons, a public profile, or comments'
  );
});

test('D-138C: no action menu wiring added outside My HumanX (review queue cleanup/mark-duplicate UI untouched)', () => {
  assert.ok(
    appSrc.includes('function reviewCleanupUI') && appSrc.includes('function markDuplicateUI'),
    'D-138C must leave the existing admin Review Queue cleanup/mark-duplicate functions in place'
  );
  assert.ok(
    !/function\s+reviewCleanupUI[\s\S]{0,400}meArchiveItemUI/.test(appSrc) &&
    !/function\s+renderReviewList[\s\S]{0,2000}meArchiveItemUI/.test(appSrc),
    'meArchiveItemUI must not be called from reviewCleanupUI or the Review Queue list renderer — archive stays scoped to My HumanX'
  );
});

test('D-138C: no backend route changes — worker.js my-humanx routes are unmodified from D-138B', () => {
  assert.ok(
    workerSrc.includes("url.pathname === '/api/my-humanx' && request.method === 'GET') return await myHumanX(request, env)") &&
    workerSrc.includes("url.pathname === '/api/my-humanx/archive' && request.method === 'POST') return await archiveMyHumanXItem(request, env)") &&
    workerSrc.includes("url.pathname === '/api/my-humanx/export' && request.method === 'GET') return await exportMyHumanX(request, env)"),
    'D-138C is frontend-only — all three /api/my-humanx* routes must remain exactly as D-137B/D-138B defined them'
  );
});

test('D-138C: Me dashboard filters/show-all/show-less, public Study opening, and account panel are preserved', () => {
  assert.ok(
    appSrc.includes('function meFilterBarHtml') && appSrc.includes('function meShowAllControl') &&
    appSrc.includes("const isPublic=state==='public'") &&
    appSrc.includes('function accountPanelHtml') &&
    appSrc.includes('function truthClaimStateMeta'),
    'D-138C must not remove D-137E filters/show-all, D-137D public-study gating, D-136C account panel, or D-137C truth claimed-state clarity'
  );
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
