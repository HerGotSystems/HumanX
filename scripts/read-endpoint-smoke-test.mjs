/**
 * scripts/read-endpoint-smoke-test.mjs
 *
 * Read-only live API smoke test for the HumanX Cloudflare Worker.
 *
 * WHAT THIS DOES:
 *   Calls read-only GET endpoints on a running HumanX Worker and confirms each
 *   returns the expected HTTP status, parseable JSON, and top-level keys.
 *
 * WHAT THIS DOES NOT DO:
 *   - Does not mutate any data (no POST/PUT/PATCH/DELETE)
 *   - Does not call admin endpoints (/api/review, /api/import-*)
 *   - Does not call /api/debug or /api/seed
 *   - Does not require or embed any admin token
 *   - Does not trigger any AI provider or consume any API credits
 *   - Does not replace manual frontend QA (see docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md)
 *   - Does not run Wrangler or D1 commands
 *
 * USAGE:
 *   node scripts/read-endpoint-smoke-test.mjs https://your-worker.workers.dev
 *   HUMANX_BASE_URL=https://your-worker.workers.dev node scripts/read-endpoint-smoke-test.mjs
 *
 * EXIT CODES:
 *   0 — all tested endpoints passed (skipped endpoints are expected and do not count as failures)
 *   1 — one or more endpoints failed
 *   2 — base URL is missing or invalid
 *
 * SPEC:
 *   docs/READ_ENDPOINT_SMOKE_TEST_SPEC.md
 *
 * RELATED:
 *   scripts/hardening-smoke-test.mjs — pure function / mock DB tests (no network)
 */

// ── Configuration ─────────────────────────────────────────────────────────────

const TIMEOUT_MS = 10_000;
const SMOKE_USER_ID = 'usr_smoketest000000000000000'; // fake, never saves data

// ── Base URL resolution ───────────────────────────────────────────────────────

function resolveBaseUrl() {
  const raw = process.argv[2] || process.env.HUMANX_BASE_URL || '';
  if (!raw) {
    console.error('ERROR: Base URL is required.');
    console.error('');
    console.error('Usage:');
    console.error('  node scripts/read-endpoint-smoke-test.mjs https://your-worker.workers.dev');
    console.error('  HUMANX_BASE_URL=https://your-worker.workers.dev node scripts/read-endpoint-smoke-test.mjs');
    process.exit(2);
  }
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    console.error(`ERROR: Base URL must start with http:// or https:// — got: ${raw}`);
    process.exit(2);
  }
  return raw.replace(/\/$/, ''); // normalize trailing slash
}

// ── Fetch helper with timeout ─────────────────────────────────────────────────

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`Request timed out after ${TIMEOUT_MS}ms`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ── Result tracking ───────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let skipped = 0;

function pass(label) {
  console.log(`  PASS: ${label}`);
  passed++;
}

function fail(label, reason) {
  console.error(`  FAIL: ${label}`);
  console.error(`        ${reason}`);
  failed++;
}

function skip(label, reason) {
  console.log(`  SKIP: ${label} — ${reason}`);
  skipped++;
}

// ── Core test helper ─────────────────────────────────────────────────────────

/**
 * Fetches an endpoint and runs a series of checks.
 *
 * @param {string} label      — short name shown in output
 * @param {string} url        — full URL
 * @param {object} opts       — fetch options (headers, etc.)
 * @param {object} expect     — { status: number, keys: string[] }
 * @returns {object|null}     — parsed JSON body if checks passed, null on failure
 */
async function checkEndpoint(label, url, opts, expect) {
  let res;
  let body;

  try {
    res = await fetchWithTimeout(url, opts);
  } catch (err) {
    fail(`${label} → network error`, err.message);
    return null;
  }

  // Status check
  if (res.status !== expect.status) {
    fail(`${label} → status`, `expected ${expect.status}, got ${res.status}`);
    return null;
  }

  // JSON parse check
  try {
    body = await res.json();
  } catch {
    fail(`${label} → JSON parse`, `response body is not valid JSON (status was ${res.status})`);
    return null;
  }

  // Top-level key checks
  if (expect.keys && expect.keys.length > 0) {
    const missing = expect.keys.filter(k => !(k in body));
    if (missing.length > 0) {
      fail(`${label} → response shape`, `missing top-level keys: ${missing.join(', ')}`);
      return null;
    }
  }

  pass(`${label} → ${res.status}, keys present: ${(expect.keys || []).join(', ') || '(any object)'}`);
  return body;
}

// ── Individual endpoint checks ───────────────────────────────────────────────

/**
 * GET /api/health
 * Static response — no D1 required.
 * Expected keys confirmed from src/worker.js inline return statement.
 */
async function checkHealth(base) {
  console.log('\n1. GET /api/health');
  const body = await checkEndpoint(
    'GET /api/health',
    `${base}/api/health`,
    {},
    { status: 200, keys: ['ok', 'service', 'mode', 'ai', 'legacy_ai'] }
  );
  if (body) {
    // Extra value assertions — these are fixed constants in worker.js
    if (body.ok !== true)          fail('GET /api/health → ok value',      `expected true, got ${JSON.stringify(body.ok)}`);
    if (body.service !== 'humanx') fail('GET /api/health → service value', `expected 'humanx', got ${JSON.stringify(body.service)}`);
    if (body.mode === 'demo-fallback') {
      console.log('        NOTE: mode=demo-fallback — D1 is not connected. Later D1 tests may return fallback responses.');
    }
  }
  return body;
}

/**
 * GET /api/ai/analyse
 * Intentionally disabled endpoint. Must return 402, never 200.
 * Confirms no AI provider is called and no API key is consumed.
 * Expected keys confirmed from src/worker.js inline return statement.
 */
async function checkAiAnalyse(base) {
  console.log('\n2. GET /api/ai/analyse');
  await checkEndpoint(
    'GET /api/ai/analyse',
    `${base}/api/ai/analyse`,
    {},
    { status: 402, keys: ['error', 'legacy_error', 'message'] }
  );
}

/**
 * GET /api/claims
 * Public read. Returns { claims: [] }.
 * Top-level key confirmed from listClaims() → mapClaims() in src/worker.js.
 * Returns the claims array for use in the /api/claims/:id test.
 */
async function checkClaims(base) {
  console.log('\n3. GET /api/claims');
  const body = await checkEndpoint(
    'GET /api/claims',
    `${base}/api/claims`,
    {},
    { status: 200, keys: ['claims'] }
  );
  if (body) {
    if (!Array.isArray(body.claims)) {
      fail('GET /api/claims → claims type', `expected array, got ${typeof body.claims}`);
      return null;
    }
    pass(`GET /api/claims → claims is array (${body.claims.length} items)`);

    // If items exist, spot-check the shape of the first item.
    // Keys confirmed from mapClaim() in src/worker.js.
    if (body.claims.length > 0) {
      const item = body.claims[0];
      const itemKeys = ['id', 'claim', 'status', 'reviewState', 'evidenceScore'];
      const missingItemKeys = itemKeys.filter(k => !(k in item));
      if (missingItemKeys.length > 0) {
        fail('GET /api/claims → first item shape', `missing keys: ${missingItemKeys.join(', ')}`);
      } else {
        pass(`GET /api/claims → first item has expected keys: ${itemKeys.join(', ')}`);
      }
    }
  }
  return body;
}

/**
 * GET /api/truths
 * Public read. Returns { truths: [] }.
 * Top-level key confirmed from listTruths() in src/truths.js.
 */
async function checkTruths(base) {
  console.log('\n4. GET /api/truths');
  const body = await checkEndpoint(
    'GET /api/truths',
    `${base}/api/truths`,
    {},
    { status: 200, keys: ['truths'] }
  );
  if (body) {
    if (!Array.isArray(body.truths)) {
      fail('GET /api/truths → truths type', `expected array, got ${typeof body.truths}`);
    } else {
      pass(`GET /api/truths → truths is array (${body.truths.length} items)`);
    }
  }
}

/**
 * GET /api/evidence-vault
 * Public read. Returns { evidence: [] }.
 * Top-level key confirmed from listEvidenceVault() in src/evidence-vault.js.
 */
async function checkEvidenceVault(base) {
  console.log('\n5. GET /api/evidence-vault');
  const body = await checkEndpoint(
    'GET /api/evidence-vault',
    `${base}/api/evidence-vault`,
    {},
    { status: 200, keys: ['evidence'] }
  );
  if (body) {
    if (!Array.isArray(body.evidence)) {
      fail('GET /api/evidence-vault → evidence type', `expected array, got ${typeof body.evidence}`);
    } else {
      pass(`GET /api/evidence-vault → evidence is array (${body.evidence.length} items)`);
    }
  }
}

/**
 * GET /api/graph-status
 * Public read. Returns { ok, graph, errors, summary }.
 * Top-level keys confirmed from graphStatus() in src/graph-status.js.
 */
async function checkGraphStatus(base) {
  console.log('\n6. GET /api/graph-status');
  await checkEndpoint(
    'GET /api/graph-status',
    `${base}/api/graph-status`,
    {},
    { status: 200, keys: ['ok', 'graph', 'errors', 'summary'] }
  );
}

/**
 * GET /api/belief-snapshots
 * Requires x-humanx-user header. Returns { snapshots: [] }.
 * Uses a deterministic fake user ID that has never saved a snapshot.
 * Returns empty array — this is not a failure.
 * Top-level key confirmed from listBeliefSnapshots() in src/belief-snapshots.js.
 */
async function checkBeliefSnapshots(base) {
  console.log('\n7. GET /api/belief-snapshots');
  console.log(`        (using fake smoke-test user: ${SMOKE_USER_ID} — no data created)`);
  const body = await checkEndpoint(
    'GET /api/belief-snapshots',
    `${base}/api/belief-snapshots`,
    { headers: { 'x-humanx-user': SMOKE_USER_ID } },
    { status: 200, keys: ['snapshots'] }
  );
  if (body) {
    if (!Array.isArray(body.snapshots)) {
      fail('GET /api/belief-snapshots → snapshots type', `expected array, got ${typeof body.snapshots}`);
    } else {
      pass(`GET /api/belief-snapshots → snapshots is array (${body.snapshots.length} items; empty is expected for smoke user)`);
    }
  }
}

/**
 * GET /api/claims/:id
 * Optional: only runs if /api/claims returned at least one claim.
 * Tests both a found case (200) and a not-found case (404).
 * Response keys confirmed from getClaim() and claimLineage() in src/worker.js.
 */
async function checkClaimById(base, claimsBody) {
  console.log('\n8. GET /api/claims/:id');

  if (!claimsBody || !Array.isArray(claimsBody.claims) || claimsBody.claims.length === 0) {
    skip('GET /api/claims/:id (found)', 'no claims returned by GET /api/claims — nothing to fetch');
    skip('GET /api/claims/:id (not-found 404)', 'skipping because found-case is skipped');
    return;
  }

  const firstId = claimsBody.claims[0].id;
  if (!firstId || typeof firstId !== 'string') {
    skip('GET /api/claims/:id (found)', 'first claim has no usable id');
    return;
  }

  // Found case
  const body = await checkEndpoint(
    `GET /api/claims/${firstId} (found)`,
    `${base}/api/claims/${encodeURIComponent(firstId)}`,
    {},
    { status: 200, keys: ['claim', 'evidence', 'pressure', 'tests', 'analyses', 'lineage'] }
  );

  if (body) {
    // lineage sub-keys confirmed from claimLineage() in src/worker.js
    const lineageKeys = ['truths', 'evidenceLinks', 'analysisCount', 'pressureCount', 'testCount'];
    if (body.lineage && typeof body.lineage === 'object') {
      const missingLineage = lineageKeys.filter(k => !(k in body.lineage));
      if (missingLineage.length > 0) {
        fail(`GET /api/claims/${firstId} → lineage shape`, `missing keys: ${missingLineage.join(', ')}`);
      } else {
        pass(`GET /api/claims/${firstId} → lineage has keys: ${lineageKeys.join(', ')}`);
      }
    }
  }

  // Not-found case — use a deliberately invalid id
  const bogusId = 'clm_smoke_notfound_00000000';
  await checkEndpoint(
    `GET /api/claims/${bogusId} (not-found)`,
    `${base}/api/claims/${bogusId}`,
    {},
    { status: 404, keys: ['error'] }
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const base = resolveBaseUrl();

  console.log('═══════════════════════════════════════════════════════');
  console.log('  HumanX Read-Endpoint Smoke Test');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Base URL : ${base}`);
  console.log(`  Timeout  : ${TIMEOUT_MS}ms per request`);
  console.log('  Mode     : read-only, no data mutation');
  console.log('═══════════════════════════════════════════════════════');

  const healthBody   = await checkHealth(base);
  await checkAiAnalyse(base);
  const claimsBody   = await checkClaims(base);
  await checkTruths(base);
  await checkEvidenceVault(base);
  await checkGraphStatus(base);
  await checkBeliefSnapshots(base);
  await checkClaimById(base, claimsBody);

  // ── Summary ────────────────────────────────────────────────────────────────

  const total = passed + failed + skipped;
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed, ${skipped} skipped (${total} total checks)`);
  console.log('═══════════════════════════════════════════════════════');

  if (failed > 0) {
    console.error(`\n  SMOKE TEST FAILED — ${failed} check(s) did not pass.`);
    console.error('  Do not proceed with Worker refactor until all checks pass.');
    process.exit(1);
  }

  console.log('\n  All checks passed. Safe to continue.');
  process.exit(0);
}

main().catch(err => {
  console.error('\nUnhandled error during smoke test:');
  console.error(err);
  process.exit(1);
});
