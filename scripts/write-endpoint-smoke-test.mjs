/**
 * scripts/write-endpoint-smoke-test.mjs
 *
 * Opt-in mutating smoke test for HumanX public write endpoints.
 *
 * WHAT THIS DOES:
 *   When all safety gates are present, submits one clearly labelled smoke-test
 *   claim via POST /api/session and POST /api/claims, then verifies the response.
 *   The claim lands in review_state='review' — not publicly visible.
 *
 * WHAT THIS DOES NOT DO:
 *   - Does not run by default (dry-run unless all gates are present)
 *   - Does not approve, vote on, or attach evidence to the test claim
 *   - Does not call admin or review endpoints
 *   - Does not call AI providers or consume API credits
 *   - Does not delete or clean up created rows
 *   - Does not replace scripts/read-endpoint-smoke-test.mjs (read baseline)
 *   - Does not replace docs/MANUAL_FRONTEND_SMOKE_CHECKLIST.md
 *   - Does not run Wrangler or D1 commands
 *
 * DEFAULT BEHAVIOUR (no gates):
 *   Prints what would be tested and the generated payload, then exits 0.
 *   Makes NO network requests.
 *
 * LIVE WRITE REQUIRES ALL THREE GATES:
 *   HUMANX_BASE_URL=https://your-site.example \
 *   HUMANX_ALLOW_WRITE_SMOKE_TEST=1 \
 *   node scripts/write-endpoint-smoke-test.mjs --i-understand-this-mutates-data
 *
 * EXIT CODES:
 *   0 — dry-run complete, OR all live write checks passed
 *   1 — live write check failed (network error, wrong status, unexpected response)
 *   2 — invalid base URL, or safety gate flags are malformed
 *
 * SPEC:
 *   docs/PUBLIC_WRITE_SMOKE_TEST_SPEC.md
 *
 * RELATED:
 *   scripts/read-endpoint-smoke-test.mjs — read-only baseline (run this first)
 *   docs/LIVE_READ_SMOKE_RESULT.md      — confirmed read baseline
 */

// ── Configuration ─────────────────────────────────────────────────────────────

const TIMEOUT_MS = 12_000;
const SMOKE_PREFIX = 'HUMANX_SMOKE_TEST_';
const REQUIRED_ENV_FLAG = 'HUMANX_ALLOW_WRITE_SMOKE_TEST';
const REQUIRED_CLI_FLAG = '--i-understand-this-mutates-data';

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomSuffix() {
  return Math.random().toString(36).slice(2, 7); // 5-char alphanumeric
}

function isoStamp() {
  return new Date().toISOString();
}

/** Generates a deterministic-per-run test user id and handle. */
function makeTestUser(suffix) {
  return {
    id: `usr_smoke_${suffix}`,
    handle: `smoke-${suffix}`
  };
}

/** Generates a clearly labelled claim string for this run. */
function makeTestClaim(ts, suffix) {
  return (
    `${SMOKE_PREFIX}${ts}_${suffix} — ` +
    `automated write smoke test; safe to reject/delete manually`
  );
}

// ── Base URL resolution ───────────────────────────────────────────────────────

function resolveBaseUrl() {
  // Accept from first non-flag CLI arg or env var
  const raw =
    process.argv.slice(2).find(a => !a.startsWith('--')) ||
    process.env.HUMANX_BASE_URL ||
    '';

  if (!raw) {
    console.error('ERROR: Base URL is required.');
    console.error('');
    printUsage();
    process.exit(2);
  }
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    console.error(`ERROR: Base URL must start with http:// or https:// — got: ${raw}`);
    process.exit(2);
  }
  return raw.replace(/\/$/, '');
}

function printUsage() {
  console.error('Usage (dry-run — no network requests):');
  console.error('  node scripts/write-endpoint-smoke-test.mjs https://your-site.example');
  console.error('');
  console.error('Usage (live write — ALL THREE gates required):');
  console.error(
    '  HUMANX_BASE_URL=https://your-site.example \\\n' +
    `  ${REQUIRED_ENV_FLAG}=1 \\\n` +
    `  node scripts/write-endpoint-smoke-test.mjs ${REQUIRED_CLI_FLAG}`
  );
}

// ── Safety gate check ─────────────────────────────────────────────────────────

function checkSafetyGates() {
  const hasCliFlag = process.argv.includes(REQUIRED_CLI_FLAG);
  const hasEnvFlag = process.env[REQUIRED_ENV_FLAG] === '1';
  return { hasCliFlag, hasEnvFlag, allOpen: hasCliFlag && hasEnvFlag };
}

// ── Fetch helper ──────────────────────────────────────────────────────────────

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

function pass(label) {
  console.log(`  PASS: ${label}`);
  passed++;
}

function fail(label, reason) {
  console.error(`  FAIL: ${label}`);
  console.error(`        ${reason}`);
  failed++;
}

// ── Dry-run output ────────────────────────────────────────────────────────────

function printDryRun(base, user, claimText, gates) {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('  DRY RUN — no network requests will be made');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log('  Missing safety gates:');
  if (!gates.hasCliFlag) {
    console.log(`    ✗ CLI flag missing: ${REQUIRED_CLI_FLAG}`);
  }
  if (!gates.hasEnvFlag) {
    console.log(`    ✗ Environment variable missing: ${REQUIRED_ENV_FLAG}=1`);
  }
  console.log('');
  console.log('  Target URL (would be used if gates were present):');
  console.log(`    ${base}`);
  console.log('');
  console.log('  What would be tested:');
  console.log('    1. POST /api/session  — create/retrieve smoke-test user (idempotent)');
  console.log('    2. POST /api/claims   — submit one labelled smoke-test claim');
  console.log('       Verify: claim.reviewState === "review" (not "public")');
  console.log('       OR: existing/dedup response (ok=true, existing=true)');
  console.log('');
  console.log('  Generated test user payload:');
  console.log('  ' + JSON.stringify({ id: user.id, handle: user.handle }, null, 2).split('\n').join('\n  '));
  console.log('');
  console.log('  Generated claim payload:');
  console.log('  ' + JSON.stringify(
    { claim: claimText, type: 'Physical/Testable', category: 'General' },
    null, 2
  ).split('\n').join('\n  '));
  console.log('');
  console.log('  To run live writes, all three gates must be present:');
  console.log(`    ${REQUIRED_ENV_FLAG}=1`);
  console.log(`    ${REQUIRED_CLI_FLAG}  (CLI flag)`);
  console.log(`    HUMANX_BASE_URL=<url>  (env or first CLI arg)`);
  console.log('');
  console.log('  IMPORTANT: Live write tests create real D1 rows.');
  console.log('  Smoke-test claims will appear in the admin review queue.');
  console.log('  They must be rejected/deleted manually by a site admin.');
  console.log('');
  console.log('  DRY RUN ONLY — exiting 0, no data was sent or created.');
}

// ── Live test: POST /api/session ──────────────────────────────────────────────

/**
 * Creates or retrieves the smoke-test user.
 * INSERT OR IGNORE in the handler makes this idempotent — safe to run repeatedly.
 *
 * Expected response shape (from createOrGetUser() in src/worker.js):
 *   { user: { id, handle, trust_score, strike_count, is_shadow_banned, is_admin } }
 */
async function liveTestSession(base, user) {
  console.log('\n1. POST /api/session (create/retrieve smoke-test user)');

  let res;
  try {
    res = await fetchWithTimeout(`${base}/api/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: user.id, handle: user.handle })
    });
  } catch (err) {
    fail('POST /api/session → network error', err.message);
    return false;
  }

  if (res.status !== 200) {
    fail('POST /api/session → status', `expected 200, got ${res.status}`);
    return false;
  }

  let body;
  try {
    body = await res.json();
  } catch {
    fail('POST /api/session → JSON parse', 'response body is not valid JSON');
    return false;
  }

  if (!body || typeof body !== 'object' || !body.user) {
    fail('POST /api/session → response shape', 'missing top-level "user" key');
    return false;
  }
  if (typeof body.user.id !== 'string' || !body.user.id) {
    fail('POST /api/session → user.id', `expected non-empty string, got ${JSON.stringify(body.user.id)}`);
    return false;
  }

  pass(`POST /api/session → 200, user.id present (${body.user.id})`);
  return true;
}

// ── Live test: POST /api/claims ───────────────────────────────────────────────

/**
 * Submits one clearly labelled smoke-test claim.
 *
 * Expected success responses (from createClaim() in src/worker.js):
 *
 *   New claim (first run or after dedup key change):
 *     HTTP 200, shape from getClaim():
 *     { claim: { id, claim, reviewState: 'review', status: 'Plausible', ... },
 *       evidence: [], pressure: [], tests: [], analyses: [], lineage: {...} }
 *     Note: no top-level 'ok' field on new-claim success.
 *
 *   Existing duplicate (second run with same claim text):
 *     HTTP 200, shape:
 *     { ok: true, existing: true, claim: { id, claim, reviewState, ... } }
 *     Note: reviewState on the existing row may differ if an admin changed it.
 *
 * Both are treated as pass — dedup working correctly is a valid test outcome.
 */
async function liveTestClaim(base, userId, claimText) {
  console.log('\n2. POST /api/claims (submit one labelled smoke-test claim)');
  console.log(`     Claim text: ${claimText.slice(0, 80)}...`);

  let res;
  try {
    res = await fetchWithTimeout(`${base}/api/claims`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-humanx-user': userId
      },
      // type and category are optional — defaults in handler are 'Physical/Testable'
      // and inferCategory() → 'General' for smoke text. Including them explicitly
      // for clarity and to avoid any future default-change surprises.
      body: JSON.stringify({
        claim: claimText,
        type: 'Physical/Testable',
        category: 'General'
      })
    });
  } catch (err) {
    fail('POST /api/claims → network error', err.message);
    return false;
  }

  if (res.status !== 200) {
    fail('POST /api/claims → status', `expected 200, got ${res.status}`);
    return false;
  }

  let body;
  try {
    body = await res.json();
  } catch {
    fail('POST /api/claims → JSON parse', 'response body is not valid JSON');
    return false;
  }

  if (!body || typeof body !== 'object') {
    fail('POST /api/claims → response type', 'expected a JSON object');
    return false;
  }

  // Path 1: existing/dedup response
  if (body.existing === true) {
    if (!body.claim || typeof body.claim.id !== 'string') {
      fail('POST /api/claims → existing response shape', 'missing claim.id in dedup response');
      return false;
    }
    pass(`POST /api/claims → 200, dedup triggered (existing=true), claim.id: ${body.claim.id}`);
    pass(`POST /api/claims → dedup behaviour confirmed — no duplicate row created`);
    return true;
  }

  // Path 2: new claim response (getClaim() format — no top-level 'ok')
  if (!body.claim || typeof body.claim !== 'object') {
    fail('POST /api/claims → response shape', 'missing top-level "claim" object');
    return false;
  }
  if (typeof body.claim.id !== 'string' || !body.claim.id) {
    fail('POST /api/claims → claim.id', `expected non-empty string, got ${JSON.stringify(body.claim.id)}`);
    return false;
  }
  if (body.claim.reviewState !== 'review') {
    fail(
      'POST /api/claims → claim.reviewState',
      `expected "review", got ${JSON.stringify(body.claim.reviewState)} — ` +
      'claim may be publicly visible; investigate before proceeding'
    );
    return false;
  }

  pass(`POST /api/claims → 200, new claim created`);
  pass(`POST /api/claims → claim.id: ${body.claim.id}`);
  pass(`POST /api/claims → claim.reviewState: "review" (not public — correct)`);
  console.log(`\n  NOTE: Smoke-test claim is now in the admin review queue.`);
  console.log(`  It is NOT publicly visible. A site admin must reject/delete it manually.`);
  console.log(`  Claim ID: ${body.claim.id}`);
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const base = resolveBaseUrl();
  const gates = checkSafetyGates();

  // Generate test data — same for dry-run and live so dry-run shows real payload shape.
  // Note: live run generates fresh suffix each time (no deterministic reuse intended
  // for claims — dedup via normalized_claim handles repeated identical text anyway).
  const ts = isoStamp();
  const suffix = randomSuffix();
  const user = makeTestUser(suffix);
  const claimText = makeTestClaim(ts, suffix);

  if (!gates.allOpen) {
    // DRY RUN — print everything, make no requests.
    printDryRun(base, user, claimText, gates);
    process.exit(0);
  }

  // ── LIVE WRITE MODE ───────────────────────────────────────────────────────

  console.log('═══════════════════════════════════════════════════════');
  console.log('  HumanX Write-Endpoint Smoke Test  ⚠ LIVE MODE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Base URL : ${base}`);
  console.log(`  Timeout  : ${TIMEOUT_MS}ms per request`);
  console.log(`  Smoke ID : ${suffix}`);
  console.log(`  Run time : ${ts}`);
  console.log('  WARNING  : This run will create real D1 rows.');
  console.log('             Test data will appear in the admin review queue.');
  console.log('             Manual cleanup is required after this test.');
  console.log('═══════════════════════════════════════════════════════');

  const sessionOk = await liveTestSession(base, user);
  if (!sessionOk) {
    console.error('\n  Session step failed — skipping claim submission.');
    console.error('  No claim was created.');
    process.exit(1);
  }

  await liveTestClaim(base, user.id, claimText);

  // ── Summary ────────────────────────────────────────────────────────────────

  const total = passed + failed;
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed (${total} total checks)`);
  console.log('═══════════════════════════════════════════════════════');

  if (failed > 0) {
    console.error(`\n  WRITE SMOKE TEST FAILED — ${failed} check(s) did not pass.`);
    process.exit(1);
  }

  console.log('\n  All write smoke checks passed.');
  console.log('  Remember: smoke-test claim must be manually rejected/deleted by a site admin.');
  process.exit(0);
}

main().catch(err => {
  console.error('\nUnhandled error during write smoke test:');
  console.error(err);
  process.exit(1);
});
