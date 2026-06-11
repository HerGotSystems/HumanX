/**
 * scripts/worker-route-static-check.mjs
 *
 * Local static Worker route / documentation consistency check.
 *
 * WHAT THIS DOES:
 *   Reads src/worker.js, docs/API_ENDPOINT_INVENTORY.md, and
 *   docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md as plain text, then:
 *   - Extracts /api/... route strings from worker source code.
 *   - Extracts documented /api/... paths from the inventory doc.
 *   - Extracts public-write /api/... paths from the risk map doc.
 *   - Cross-references code vs docs and reports mismatches.
 *   - Confirms all known high-risk routes are documented.
 *   - Confirms all risk-map routes are covered by the inventory.
 *
 * WHAT THIS DOES NOT DO:
 *   - Makes no network calls of any kind.
 *   - Causes no mutations (no D1, no Wrangler, no writes).
 *   - Does not execute or import src/worker.js.
 *   - Does not prove endpoint behaviour, rate limits, or auth correctness.
 *   - Does not replace read/write smoke tests or manual QA.
 *   - Does not call any production endpoint.
 *
 * USAGE:
 *   node scripts/worker-route-static-check.mjs
 *
 * EXIT CODES:
 *   0 — all hard checks passed (warnings OK)
 *   1 — one or more hard checks failed
 *   2 — a required file is missing or unreadable
 *
 * SPEC:
 *   docs/WORKER_ROUTE_STATIC_CHECK_SPEC.md
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Root resolution ────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function abs(...parts) {
  return join(ROOT, ...parts);
}

// ── Result tracking ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let warned = 0;

function pass(label) {
  console.log(`  PASS: ${label}`);
  passed++;
}

function fail(label, detail) {
  console.error(`  FAIL: ${label}`);
  if (detail) console.error(`        ${detail}`);
  failed++;
}

function warn(label, detail) {
  console.warn(`  WARN: ${label}`);
  if (detail) console.warn(`        ${detail}`);
  warned++;
}

function info(label) {
  console.log(`        ${label}`);
}

// ── File helpers ───────────────────────────────────────────────────────────────

async function readRequired(relPath) {
  try {
    return await readFile(abs(relPath), 'utf8');
  } catch {
    console.error(`\nFATAL: Required file missing or unreadable: ${relPath}`);
    process.exit(2);
  }
}

// ── Route extraction ───────────────────────────────────────────────────────────

/**
 * Extract literal /api/... path strings from worker source.
 * Matches single- or double-quoted strings containing /api/... paths.
 * Returns an array of unique normalised paths (trailing slash stripped).
 */
function extractWorkerRoutes(src) {
  const seen = new Set();
  // Match quoted literals: '/api/foo' or "/api/foo"
  const re = /['"]((\/api\/)[^'"\s]*)['"]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const path = m[1].replace(/\/$/, '');
    // Skip the bare prefix guard '/api/' and '/api' — not a routed endpoint
    if (path === '/api' || path === '/api/') continue;
    seen.add(path);
  }
  return [...seen].sort();
}

/**
 * Extract /api/... paths from a markdown doc.
 * Handles:
 *   - backtick-wrapped paths: `/api/foo` or `/api/foo/:id`
 *   - table cells with paths: | GET | `/api/foo` |
 *   - inline code: `GET /api/foo`
 * Returns an array of unique normalised paths.
 */
function extractDocRoutes(src) {
  const seen = new Set();
  // Backtick-wrapped paths containing /api/
  const re = /`((\/api\/)[^`\s]*)`/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    // Strip method prefix if present: "GET /api/foo" -> "/api/foo"
    const raw = m[1].replace(/^[A-Z]+ /, '').replace(/\/$/, '');
    // Skip placeholder patterns like /api/... used in doc prose
    if (raw.startsWith('/api/') && !raw.includes('...')) seen.add(raw);
  }
  return [...seen].sort();
}

// ── Normalise for comparison ───────────────────────────────────────────────────

/**
 * Collapse a parameterised path to its base for comparison.
 * /api/claims/:id -> /api/claims
 * Used only to check whether a docs route has a code-side base.
 */
function baseOf(path) {
  return path.replace(/\/:[^/]+/g, '').replace(/\/$/, '');
}

// ── High-risk routes ───────────────────────────────────────────────────────────

const HIGH_RISK_ROUTES = [
  '/api/claims',
  '/api/claim-vote',
  '/api/evidence',
  '/api/evidence-attach',
  '/api/truths',
  '/api/truth-to-claim',
  '/api/belief-snapshots',
  '/api/belief-promote',
  '/api/review',
  '/api/review/decision',
  '/api/review/mark-duplicate',
  '/api/review/resolve-similar',
  '/api/ai/analyse',
];

// Low-risk routes that are intentionally excluded from strict undocumented-route failures
const LOW_RISK_UNLISTED = new Set(['/api/seed', '/api/debug']);

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('Worker Route Static Check');
  console.log('--------------------------');

  // ── 1. Read required files ─────────────────────────────────────────────────

  const workerSrc   = await readRequired('src/worker.js');
  const inventorySrc = await readRequired('docs/API_ENDPOINT_INVENTORY.md');
  const riskMapSrc  = await readRequired('docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md');

  pass('src/worker.js exists and is readable');
  pass('docs/API_ENDPOINT_INVENTORY.md exists and is readable');
  pass('docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md exists and is readable');

  // ── 2. Extract routes ──────────────────────────────────────────────────────

  const workerRoutes    = extractWorkerRoutes(workerSrc);
  const inventoryRoutes = extractDocRoutes(inventorySrc);
  const riskMapRoutes   = extractDocRoutes(riskMapSrc);

  pass(`extracted ${workerRoutes.length} route string(s) from src/worker.js`);
  pass(`extracted ${inventoryRoutes.length} route path(s) from docs/API_ENDPOINT_INVENTORY.md`);
  pass(`extracted ${riskMapRoutes.length} route path(s) from docs/PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md`);

  // ── 3. Print route lists ───────────────────────────────────────────────────

  console.log('');
  console.log('  Routes extracted from src/worker.js:');
  for (const r of workerRoutes) info(r);

  console.log('');
  console.log('  Routes extracted from API_ENDPOINT_INVENTORY.md:');
  for (const r of inventoryRoutes) info(r);

  console.log('');
  console.log('  Routes extracted from PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md:');
  for (const r of riskMapRoutes) info(r);

  // ── 4. Cross-reference: code vs inventory ──────────────────────────────────

  // Build a flat set of inventory paths, plus base paths for parameterised routes
  const inventorySet = new Set(inventoryRoutes);
  const inventoryBases = new Set(inventoryRoutes.map(baseOf));

  // Code-only: in worker but not in inventory (by exact match or base match)
  const codeOnly = workerRoutes.filter(r => !inventorySet.has(r) && !inventoryBases.has(r));

  // Docs-only: in inventory but not in worker (by exact match or base match for params)
  const workerSet = new Set(workerRoutes);
  const docsOnly = inventoryRoutes.filter(r => {
    const base = baseOf(r);
    return !workerSet.has(r) && !workerSet.has(base);
  });

  console.log('');
  console.log('  Routes in code but not in inventory:');
  if (codeOnly.length === 0) {
    info('(none)');
  } else {
    for (const r of codeOnly) {
      if (LOW_RISK_UNLISTED.has(r)) {
        warn(`${r} — present in code, not in inventory (intentionally unlisted low-risk route)`);
      } else {
        warn(`${r} — present in code but absent from inventory (review recommended)`);
      }
    }
  }

  console.log('');
  console.log('  Routes in inventory but not in code:');
  if (docsOnly.length === 0) {
    info('(none)');
  } else {
    for (const r of docsOnly) {
      if (r.includes('/:')) {
        warn(`${r} — parameterised route; expected absence from literal routing block (known limitation)`);
      } else {
        warn(`${r} — documented but not found as literal string in src/worker.js (delegated, removed, or docs stale)`);
      }
    }
  }

  // ── 5. High-risk route checks ──────────────────────────────────────────────

  console.log('');
  console.log('  High-risk route inventory coverage:');
  for (const route of HIGH_RISK_ROUTES) {
    const inCode = workerSet.has(route);
    const inDocs = inventorySet.has(route) || inventoryBases.has(route);

    if (!inCode) {
      // Route not in code at all — not a hard failure, just note it
      warn(`${route} — not found in src/worker.js (may have been removed or renamed)`);
    } else if (!inDocs) {
      fail(
        `${route} — present in src/worker.js but MISSING from docs/API_ENDPOINT_INVENTORY.md`,
        'High-risk route must be documented before any Worker change'
      );
    } else {
      pass(`${route} — present in code and inventory`);
    }
  }

  // ── 6. Risk map / inventory coverage ──────────────────────────────────────

  console.log('');
  console.log('  Public-write risk map coverage in inventory:');
  for (const route of riskMapRoutes) {
    const base = baseOf(route);
    const inInventory = inventorySet.has(route) || inventorySet.has(base) || inventoryBases.has(base);
    if (inInventory) {
      pass(`${route} — risk map route present in inventory`);
    } else {
      fail(
        `${route} — listed in PUBLIC_WRITE_ENDPOINTS_RISK_MAP.md but MISSING from API_ENDPOINT_INVENTORY.md`,
        'Risk map and inventory have drifted — update inventory before any Worker change'
      );
    }
  }

  // ── D-104F: evidence source URL validation ──────────────────────────────────
  console.log('');
  console.log('  D-104F evidence source URL validation:');

  if (/function httpUrlOrNull\s*\(/.test(workerSrc)) {
    pass('httpUrlOrNull helper defined in src/worker.js');
  } else {
    fail('httpUrlOrNull helper missing', 'D-104F must add a Worker-side source URL validator');
  }

  const helperIdx = workerSrc.indexOf('function httpUrlOrNull');
  const helperBody = helperIdx === -1 ? '' : workerSrc.slice(helperIdx, helperIdx + 320);
  if (helperBody.includes('new URL(') && helperBody.includes('catch')) {
    pass('httpUrlOrNull uses new URL() inside try/catch');
  } else {
    fail('httpUrlOrNull must parse with new URL() inside try/catch');
  }

  if (helperBody.includes("'http:'") && helperBody.includes("'https:'")) {
    pass('httpUrlOrNull whitelists only http: and https:');
  } else {
    fail('httpUrlOrNull must whitelist http: and https: only');
  }

  if (helperBody.includes('return null')) {
    pass('httpUrlOrNull returns null for disallowed/invalid URLs (coerce-to-null, not reject)');
  } else {
    fail('httpUrlOrNull must return null for disallowed/invalid URLs');
  }

  if (workerSrc.includes('httpUrlOrNull(body.sourceUrl)')) {
    pass('/api/evidence write path routes body.sourceUrl through httpUrlOrNull');
  } else {
    fail('/api/evidence must validate body.sourceUrl via httpUrlOrNull');
  }

  if (!workerSrc.includes("cleanText(body.sourceUrl || '',500)")) {
    pass('/api/evidence no longer inserts raw cleanText(body.sourceUrl) directly');
  } else {
    fail('/api/evidence still inserts the raw cleaned sourceUrl without scheme validation');
  }

  // Pressure route must remain free of source_url handling
  if (!/INSERT INTO pressure_points[\s\S]{0,400}source_url/.test(workerSrc)) {
    pass('pressure_points insert still has no source_url column (unchanged)');
  } else {
    fail('pressure_points insert unexpectedly references source_url');
  }

  // Neutrality: no verification/trust wording introduced near the helper
  if (!/verified source|trusted source/i.test(workerSrc)) {
    pass('no "verified source" / "trusted source" wording in Worker');
  } else {
    fail('Worker must not claim source verification/trust');
  }

  // No new migration/schema reference introduced by this patch
  if (!/ALTER TABLE evidence[\s\S]{0,60}source/i.test(workerSrc)) {
    pass('no evidence source_url schema/migration change in Worker');
  } else {
    fail('D-104F must not alter the evidence schema');
  }

  // ── D-106B: admin secret hygiene + debug route hardening ────────────────────
  console.log('');
  console.log('  D-106B admin secret hygiene + debug hardening:');

  // .gitignore present and ignores local env / secret files
  let gitignoreSrc = '';
  try { gitignoreSrc = await readFile(abs('.gitignore'), 'utf8'); } catch { gitignoreSrc = ''; }
  if (gitignoreSrc && /(^|\n)\.dev\.vars(\n|$)/.test(gitignoreSrc) && /(^|\n)\.env(\n|$)/.test(gitignoreSrc) && gitignoreSrc.includes('.env.*')) {
    pass('.gitignore exists and ignores .dev.vars and .env/.env.*');
  } else {
    fail('.gitignore must exist and ignore .dev.vars and .env/.env.*');
  }

  // /api/debug is admin-gated
  const debugMatch = workerSrc.match(/url\.pathname === '\/api\/debug'[\s\S]{0,200}?debugState\(request, env\)/);
  if (debugMatch && /requireAdmin\(request, env\)/.test(debugMatch[0])) {
    pass('/api/debug route requires requireAdmin before debugState');
  } else {
    fail('/api/debug must call requireAdmin before returning debugState');
  }

  // debug response shape preserved (debugState still exists and returns counts)
  if (workerSrc.includes('async function debugState') && /debugState[\s\S]{0,800}counts/.test(workerSrc)) {
    pass('debugState response shape (counts) preserved after gating');
  } else {
    fail('debugState must remain and keep its counts response shape');
  }

  // safeEqual helper present and used by requireAdmin; no raw simple-equality compare remains
  if (workerSrc.includes('function safeEqual(')) {
    pass('safeEqual timing-safe-ish helper defined');
  } else {
    fail('safeEqual helper must be defined');
  }
  if (/function requireAdmin[\s\S]{0,200}safeEqual\(/.test(workerSrc)) {
    pass('requireAdmin uses safeEqual for token comparison');
  } else {
    fail('requireAdmin must compare via safeEqual');
  }
  if (!workerSrc.includes('admin !== (env.HUMANX_ADMIN_TOKEN')) {
    pass('no raw `admin !== env.HUMANX_ADMIN_TOKEN` comparison remains');
  } else {
    fail('raw simple-equality admin comparison must be removed');
  }

  // requireAdmin remains fail-closed on missing env token
  if (/function requireAdmin[\s\S]{0,220}!expected/.test(workerSrc)) {
    pass('requireAdmin fail-closes when HUMANX_ADMIN_TOKEN env is missing/empty');
  } else {
    fail('requireAdmin must fail closed when the admin token env var is missing');
  }

  // No secret literal committed: HUMANX_ADMIN_TOKEN must never be assigned a value in tracked code/docs
  const tokenAssign = /HUMANX_ADMIN_TOKEN\s*[=:]\s*['"][A-Za-z0-9_\-]{8,}['"]/;
  if (!tokenAssign.test(workerSrc)) {
    pass('no HUMANX_ADMIN_TOKEN value literal assigned in src/worker.js');
  } else {
    fail('HUMANX_ADMIN_TOKEN must never be assigned a literal value');
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  const total = passed + failed;
  console.log('');
  console.log('--------------------------');
  console.log(`  ${passed} passed, ${failed} failed${warned > 0 ? `, ${warned} warn` : ''} (${total} hard checks)`);
  console.log('');

  if (failed > 0) {
    console.error(`  WORKER ROUTE STATIC CHECK FAILED — ${failed} hard check(s) did not pass.`);
    console.error('  Resolve failures before making any Worker routing or endpoint change.');
    console.log('');
    process.exit(1);
  }

  console.log('  All hard checks passed.');
  if (warned > 0) {
    console.warn(`  ${warned} warning(s) above — review before Worker refactor or route changes.`);
  }
  console.log('');
  process.exit(0);
}

main().catch(err => {
  console.error('\nUnhandled error during worker route static check:');
  console.error(err);
  process.exit(1);
});
