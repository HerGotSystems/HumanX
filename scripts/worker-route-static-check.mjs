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
