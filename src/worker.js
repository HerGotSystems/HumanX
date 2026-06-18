import { listEvidenceVault } from './evidence-vault.js';
import { importSeedData } from './importer.js';
import { voteClaim } from './votes.js';
import { listTruths, createTruth } from './truths.js';
import { importTruthSeeds } from './truth-seed.js';
import { convertTruthToClaim } from './truth-claim-bridge.js';
import { attachEvidenceToClaim } from './evidence-reuse.js';
import { graphStatus } from './graph-status.js';
import { addAnalysisResult, listAnalysisForClaim } from './analysis-results.js';
import { saveBeliefSnapshot, listBeliefSnapshots } from './belief-snapshots.js';
import { promoteBeliefSnapshot } from './belief-bridge.js';
import { recalcClaimScore } from './claim-scoring.js';
import { meaningKey, meaningMatch } from './meaning-key.js';
import { cleanClaimBuilderContext, insertClaimBuilderContext, attachClaimBuilderContexts } from './claim-builder-contexts.js';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,x-humanx-user,x-humanx-admin'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    try {
      if (url.pathname === '/api/health') return json({ ok: true, service: 'humanx', mode: env.DB ? 'd1-live' : 'demo-fallback', ai: 'runpack-first-no-public-inference', legacy_ai: 'aip-first-no-public-inference' });
      if (url.pathname === '/api/ai/analyse') return json({ error: 'RUNPACK_MODE', legacy_error: 'AIP_MODE', message: 'HumanX is RunPack-first. Public users copy a task packet and run it with their own AI. Owner API credits are not used for public analysis.' }, 402);
      if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
      if (!env.DB) return fallbackApi(request, url);
      if (url.pathname === '/api/debug' && request.method === 'GET') { const adminError = requireAdmin(request, env); if (adminError) return adminError; return debugState(request, env); }
      if (url.pathname === '/api/seed' && request.method === 'GET') { const adminError = requireAdmin(request, env); if (adminError) return adminError; return seedDemoClaims(request, env); }
      if (url.pathname === '/api/import-seed' && request.method === 'GET') { const adminError = requireAdmin(request, env); if (adminError) return adminError; const mode = url.searchParams.get('mode') || 'dry-run'; if (mode !== 'dry-run' && mode !== 'apply') return json({ error:'INVALID_MODE', message:"mode must be 'dry-run' or 'apply'" },400); return json(await importSeedData(env, { dryRun: mode !== 'apply' })); }
      if (url.pathname === '/api/import-truths' && request.method === 'GET') { const adminError = requireAdmin(request, env); if (adminError) return adminError; const mode = url.searchParams.get('mode') || 'dry-run'; if (mode !== 'dry-run' && mode !== 'apply') return json({ error:'INVALID_MODE', message:"mode must be 'dry-run' or 'apply'" },400); return json(await importTruthSeeds(env, { dryRun: mode !== 'apply' })); }
      if (url.pathname === '/api/claim-vote' && request.method === 'POST') return await voteClaim(request, env, { readJson, cleanId, json, requireUser: async (req) => requireUser(req, env), makeId });
      if (url.pathname === '/api/session' && request.method === 'POST') return await createOrGetUser(request, env);
      if (url.pathname === '/api/me' && request.method === 'GET') return await getMe(request, env);
      if (url.pathname === '/api/my-humanx' && request.method === 'GET') return await myHumanX(request, env);
      if (url.pathname === '/api/auth/invite/create' && request.method === 'POST') { const adminError = requireAdmin(request, env); if (adminError) return adminError; return await createInviteCode(request, env); }
      if (url.pathname === '/api/auth/invite/redeem' && request.method === 'POST') return await redeemInviteCode(request, env);
      if (url.pathname === '/api/claims' && request.method === 'GET') return await listClaims(request, env);
      if (url.pathname === '/api/claims' && request.method === 'POST') return await createClaim(request, env);
      if (url.pathname === '/api/evidence-vault' && request.method === 'GET') return await listEvidenceVault(request, env, { json });
      if (url.pathname === '/api/truths' && request.method === 'GET') return await listTruths(request, env, { json });
      if (url.pathname === '/api/truths' && request.method === 'POST') return await createTruth(request, env, { readJson, cleanText, cleanId, json, requireUser: async (req) => requireUser(req, env), makeId });
      if (url.pathname === '/api/truth-to-claim' && request.method === 'POST') return await convertTruthToClaim(request, env, { readJson, cleanId, cleanText, json, requireUser: async (req) => requireUser(req, env), makeId, isAdmin: () => requireAdmin(request, env) === null });
      if (url.pathname === '/api/evidence-attach' && request.method === 'POST') return await attachEvidenceToClaim(request, env, { readJson, cleanId, cleanText, json, requireUser: async (req) => requireUser(req, env), makeId });
      if (url.pathname === '/api/graph-status' && request.method === 'GET') return await graphStatus(request, env, { json });
      if (url.pathname === '/api/analysis' && request.method === 'POST') return await addAnalysisResult(request, env, { readJson, cleanId, cleanText, json, requireUser: async (req) => requireUser(req, env), makeId });
      if (url.pathname === '/api/belief-snapshots' && request.method === 'GET') return await listBeliefSnapshots(request, env, { json, requireUser: requireUserId });
      if (url.pathname === '/api/belief-snapshots' && request.method === 'POST') return await saveBeliefSnapshot(request, env, { readJson, cleanId, cleanText, json, requireUser: async (req) => requireUser(req, env), makeId });
      if (url.pathname === '/api/belief-promote' && request.method === 'POST') return await promoteBeliefSnapshot(request, env, { readJson, cleanId, cleanText, json, requireUser: async (req) => requireUser(req, env), makeId });
      if (url.pathname.match(/^\/api\/claims\/[^/]+$/) && request.method === 'GET') return await getClaim(request, env, url.pathname.split('/').pop());
      if (url.pathname === '/api/evidence' && request.method === 'POST') return await addEvidence(request, env);
      if (url.pathname === '/api/pressure' && request.method === 'POST') return await addPressure(request, env);
      if (url.pathname === '/api/tests' && request.method === 'POST') return await addHomeTest(request, env);
      if (url.pathname === '/api/report' && request.method === 'POST') return await reportTarget(request, env);
      if (url.pathname === '/api/aip' && request.method === 'POST') return await createAipPacket(request, env);
      if (url.pathname === '/api/runpack' && request.method === 'POST') return await createAipPacket(request, env);
      if (url.pathname === '/api/review' && request.method === 'GET') return await reviewQueue(request, env);
      if (url.pathname === '/api/review/decision' && request.method === 'POST') return await reviewDecision(request, env);
      if (url.pathname === '/api/review/cleanup' && request.method === 'POST') return await reviewCleanup(request, env);
      if (url.pathname === '/api/review/mark-duplicate' && request.method === 'POST') return await markDuplicate(request, env);
      if (url.pathname === '/api/review/resolve-similar' && request.method === 'POST') return await resolveSimilar(request, env);
      return json({ error: 'NOT_FOUND' }, 404);
    } catch (err) {
      const message = String(err && err.message ? err.message : err);
      if (message.includes('MISSING_PSEUDONYMOUS_USER')) return json({ error:'UNAUTHORIZED', message:'Missing x-humanx-user header.' },401);
      if (message.includes('USER_SHADOW_BANNED')) return json({ error:'UNAUTHORIZED', message:'Action not permitted.' },403);
      if (message.includes('RATE_LIMITED')) return json({ error:'RATE_LIMITED', message:'Too many requests. Try again later.' },429);
      if (message.includes('RATE_LIMIT_UNAVAILABLE')) return json({ error:'RATE_LIMIT_UNAVAILABLE', message:'Write protection is temporarily unavailable. Try again later.' },503);
      return json({ error: 'SERVER_ERROR', message }, 500);
    }
  }
};

async function debugState(request, env) { const tables = ['users','claims','evidence','pressure_points','reports','aip_packets','rate_limits','analysis_results','belief_snapshots','truths','truth_claim_links','evidence_claim_links','claim_votes','evidence_votes','truth_votes','home_tests','duplicate_signatures']; const counts = {}; for (const table of tables) { try { const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first(); counts[table] = row?.n ?? 0; } catch (err) { counts[table] = `ERROR: ${err.message}`; } } const latest = await env.DB.prepare(`SELECT id, claim, status, review_state, created_at FROM claims ORDER BY created_at DESC LIMIT 5`).all().catch(err => ({ error: err.message, results: [] })); return json({ ok: true, counts, latest: latest.results || [], latest_error: latest.error || null }); }
async function seedDemoClaims(request, env) { await ensureUser(env, 'usr_demo_seed'); const existing = await env.DB.prepare(`SELECT COUNT(*) AS n FROM claims`).first(); if ((existing?.n || 0) > 0) return json({ ok: true, message: 'Database already has claims. Seed not needed.', count: existing.n }); const now = Date.now(); for (const c of demoClaims()) await env.DB.prepare(`INSERT OR IGNORE INTO claims (id,user_id,claim,category,type,status,evidence_score,survivability,testability,contradictions,created_at,updated_at,review_state) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(c.id,'usr_demo_seed',c.claim,c.category,c.type,c.status,c.evidenceScore,c.survivability,c.testability,c.contradictions,now,now,'public').run(); return json({ ok: true, seeded: demoClaims().length }); }
async function createOrGetUser(request, env) { const body = await readJson(request); const now = Date.now(); const userId = cleanId(body.id) || makeId('usr'); const handle = cleanHandle(body.handle) || `anon-${userId.slice(-6)}`; const fingerprint = String(body.fingerprintHash || '').slice(0,128); await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, fingerprint_hash, created_at) VALUES (?, ?, ?, ?)`).bind(userId,handle,fingerprint,now).run(); let user = await env.DB.prepare(`SELECT id, handle, trust_score, strike_count, is_shadow_banned, is_admin FROM users WHERE id=?`).bind(userId).first(); if (!user) { await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at) VALUES (?, ?, ?)`).bind(userId,`anon-${userId.slice(-6)}`,now).run(); user = await env.DB.prepare(`SELECT id, handle, trust_score, strike_count, is_shadow_banned, is_admin FROM users WHERE id=?`).bind(userId).first(); } return json({ user }); }

// D-136B: invite-code auth foundation.
// Identity is still the unsigned x-humanx-user header (known limitation —
// see docs/README.md). Verification only upgrades the existing anonymous
// row in place; it never mints a new user id and never touches is_admin.

async function getMe(request, env) {
  const userId = requireUserId(request);
  await ensureUser(env, userId);
  // is_admin and any admin-token material are intentionally omitted from this response.
  const user = await env.DB.prepare(`SELECT id, handle, email, verified, verified_at, display_name, trust_score, strike_count, is_shadow_banned, created_at FROM users WHERE id=?`).bind(userId).first();
  return json({ user });
}

// D-137B: My HumanX personal dashboard backend.
// Always scoped to the requester's own x-humanx-user identity — never accepts
// a caller-supplied target user id, so this endpoint cannot be used to read
// another user's content even though the identity header itself remains
// unsigned/spoofable (carried-forward limitation, see docs/D136E_INVITE_AUTH_CHECKPOINT.md).

const MY_HUMANX_REVIEW_STATES = ['public', 'review', 'rejected', 'archived', 'duplicate'];

async function userContentCounts(env, table, userIdColumn, userId) {
  // table/userIdColumn are always one of our own fixed internal constants below,
  // never derived from request input — safe to interpolate.
  const rows = await env.DB.prepare(
    `SELECT COALESCE(review_state,'public') AS state, COUNT(*) AS n FROM ${table} WHERE ${userIdColumn}=? GROUP BY COALESCE(review_state,'public')`
  ).bind(userId).all();
  const counts = {};
  for (const s of MY_HUMANX_REVIEW_STATES) counts[s] = 0;
  for (const r of (rows.results || [])) { if (Object.prototype.hasOwnProperty.call(counts, r.state)) counts[r.state] = r.n; }
  return counts;
}

async function myHumanX(request, env) {
  const userId = requireUserId(request);
  await ensureUser(env, userId);

  const user = await env.DB.prepare(`SELECT id, handle, email, verified, verified_at, display_name, trust_score, strike_count, is_shadow_banned, created_at FROM users WHERE id=?`).bind(userId).first();

  const [claimCounts, truthCounts, evidenceCounts, pressureCounts] = await Promise.all([
    userContentCounts(env, 'claims', 'user_id', userId),
    userContentCounts(env, 'truths', 'user_id', userId),
    userContentCounts(env, 'evidence', 'user_id', userId),
    userContentCounts(env, 'pressure_points', 'user_id', userId),
  ]);

  const [claimsRows, truthsRows, evidenceRows, pressureRows, beliefRows] = await Promise.all([
    env.DB.prepare(`SELECT id, claim, category, type AS claim_type, status, review_state, evidence_score, testability, survivability, created_at, updated_at FROM claims WHERE user_id=? ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 20`).bind(userId).all(),
    env.DB.prepare(`SELECT id, statement, category, origin, review_state, created_at, updated_at FROM truths WHERE user_id=? ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 20`).bind(userId).all(),
    // evidence has no updated_at column — sort by created_at only.
    env.DB.prepare(`SELECT id, claim_id, title, quality AS type, source_url, review_state, created_at FROM evidence WHERE user_id=? ORDER BY created_at DESC LIMIT 20`).bind(userId).all(),
    env.DB.prepare(`SELECT id, claim_id, title, body, severity, review_state, created_at, updated_at FROM pressure_points WHERE user_id=? ORDER BY COALESCE(updated_at,created_at) DESC LIMIT 20`).bind(userId).all(),
    env.DB.prepare(`SELECT id, label, stability_score, openness_score, pressure_score, created_at FROM belief_snapshots WHERE user_id=? ORDER BY created_at DESC LIMIT 10`).bind(userId).all(),
  ]);

  return json({
    ok: true,
    user,
    counts: { claims: claimCounts, truths: truthCounts, evidence: evidenceCounts, pressure: pressureCounts },
    claims: claimsRows.results || [],
    truths: truthsRows.results || [],
    evidence: evidenceRows.results || [],
    pressure: pressureRows.results || [],
    belief_snapshots: beliefRows.results || [],
  });
}

async function createInviteCode(request, env) {
  const body = await readJson(request);
  const note = cleanText(body.note || '', 200);
  const emailHint = cleanText(body.emailHint || '', 200);
  const expiresAt = Number.isFinite(Number(body.expiresAt)) && Number(body.expiresAt) > 0 ? Number(body.expiresAt) : null;
  const code = `inv_${crypto.randomUUID().replaceAll('-', '').slice(0, 24)}`;
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO invite_codes (code, created_by, created_at, email_hint, expires_at, revoked) VALUES (?,?,?,?,?,?)`)
    .bind(code, note || 'admin', now, emailHint || null, expiresAt, 0).run();
  const invite = await env.DB.prepare(`SELECT code, created_by, created_at, redeemed_by, redeemed_at, email_hint, expires_at, revoked FROM invite_codes WHERE code=?`).bind(code).first();
  return json({ ok: true, code, invite });
}

function isValidEmail(v) {
  const s = String(v || '').trim();
  if (s.length < 5 || s.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function redeemInviteCode(request, env) {
  const userId = await requireUser(request, env);
  await safeRateLimit(request, env, `invite-redeem:${ip(request)}`, 8, 3600000);
  const body = await readJson(request);
  const code = cleanId(body.code || '');
  const email = String(body.email || '').trim().toLowerCase();
  const displayName = body.displayName != null ? cleanText(body.displayName, 80) : null;
  if (!code) return json({ error: 'CODE_REQUIRED' }, 400);
  if (!isValidEmail(email)) return json({ error: 'INVALID_EMAIL' }, 400);

  await ensureUser(env, userId);

  const invite = await env.DB.prepare(`SELECT code, redeemed_by, revoked, expires_at FROM invite_codes WHERE code=?`).bind(code).first();
  if (!invite) return json({ error: 'INVITE_NOT_FOUND' }, 404);
  if (invite.revoked) return json({ error: 'INVITE_REVOKED' }, 400);
  if (invite.redeemed_by) return json({ error: 'INVITE_ALREADY_REDEEMED' }, 400);
  if (invite.expires_at && Number(invite.expires_at) < Date.now()) return json({ error: 'INVITE_EXPIRED' }, 400);

  const emailOwner = await env.DB.prepare(`SELECT id FROM users WHERE email=? AND id!=?`).bind(email, userId).first();
  if (emailOwner) return json({ error: 'EMAIL_ALREADY_IN_USE' }, 400);

  const now = Date.now();
  // Atomic single-use claim: only succeeds if the code is still unredeemed/unrevoked/unexpired
  // at the moment of the UPDATE — closes the race window between the read above and this write.
  const claim = await env.DB.prepare(`
    UPDATE invite_codes SET redeemed_by=?, redeemed_at=?
    WHERE code=? AND redeemed_by IS NULL AND revoked=0 AND (expires_at IS NULL OR expires_at>=?)
  `).bind(userId, now, code, now).run();
  if (!claim.meta || claim.meta.changes === 0) return json({ error: 'INVITE_ALREADY_REDEEMED' }, 400);

  try {
    // Never writes is_admin — verification only ever sets email/verified/verified_at/display_name.
    await env.DB.prepare(`UPDATE users SET email=?, verified=1, verified_at=?, display_name=COALESCE(?,display_name) WHERE id=?`)
      .bind(email, now, displayName, userId).run();
  } catch (err) {
    // Roll back the invite claim so the code remains usable if the user update fails
    // (e.g. a raced email-uniqueness violation that slipped past the pre-check above).
    await env.DB.prepare(`UPDATE invite_codes SET redeemed_by=NULL, redeemed_at=NULL WHERE code=?`).bind(code).run().catch(() => {});
    if (isUniqueConstraintError(err)) return json({ error: 'EMAIL_ALREADY_IN_USE' }, 400);
    throw err;
  }

  const user = await env.DB.prepare(`SELECT id, handle, email, verified, verified_at, display_name, trust_score, strike_count, is_shadow_banned, created_at FROM users WHERE id=?`).bind(userId).first();
  return json({ ok: true, user });
}
async function listClaims(request, env) { const url = new URL(request.url); const q = `%${String(url.searchParams.get('q') || '').slice(0,80)}%`; const status = String(url.searchParams.get('status') || 'all'); const limit = Math.min(50,Math.max(1,Number(url.searchParams.get('limit') || 30))); const rows = status === 'all' ? await env.DB.prepare(`SELECT c.*, u.handle FROM claims c LEFT JOIN users u ON u.id=c.user_id WHERE COALESCE(c.review_state,'public')='public' AND c.claim LIKE ? ORDER BY c.created_at DESC LIMIT ?`).bind(q,limit).all() : await env.DB.prepare(`SELECT c.*, u.handle FROM claims c LEFT JOIN users u ON u.id=c.user_id WHERE COALESCE(c.review_state,'public')='public' AND c.status=? AND c.claim LIKE ? ORDER BY c.created_at DESC LIMIT ?`).bind(status,q,limit).all(); return json({ claims: mapClaims(rows.results || []) }); }
async function getClaim(request, env, claimId) { const claim = await env.DB.prepare(`SELECT c.*, u.handle FROM claims c LEFT JOIN users u ON u.id=c.user_id WHERE c.id=?`).bind(claimId).first(); if (!claim) return json({ error: 'CLAIM_NOT_FOUND' }, 404); if ((claim.review_state||'public')!=='public') return json({error:'CLAIM_NOT_FOUND'},404); const analyses = await listAnalysisForClaim(env, claimId); const directEvidence = await env.DB.prepare(`SELECT e.*, u.handle, 'direct' AS link_type FROM evidence e LEFT JOIN users u ON u.id=e.user_id WHERE e.claim_id=? AND COALESCE(e.review_state,'public')='public'`).bind(claimId).all(); const reusedEvidence = await env.DB.prepare(`SELECT e.*, u.handle, l.stance AS linked_stance, l.link_note, 'reused' AS link_type FROM evidence_claim_links l JOIN evidence e ON e.id=l.evidence_id LEFT JOIN users u ON u.id=e.user_id WHERE l.claim_id=? AND COALESCE(e.review_state,'public')='public'`).bind(claimId).all(); const evidence = [...(directEvidence.results || []), ...(reusedEvidence.results || [])].sort((a,b)=>(b.created_at||0)-(a.created_at||0)); const pressure = await env.DB.prepare(`SELECT p.*, u.handle FROM pressure_points p LEFT JOIN users u ON u.id=p.user_id WHERE p.claim_id=? AND COALESCE(p.review_state,'public')='public' ORDER BY p.created_at DESC`).bind(claimId).all(); const tests = await env.DB.prepare(`SELECT t.*, u.handle FROM home_tests t LEFT JOIN users u ON u.id=t.user_id WHERE t.claim_id=? ORDER BY t.created_at DESC`).bind(claimId).all(); const lineage = await claimLineage(env, claimId, evidence, analyses, pressure.results || [], tests.results || []); return json({ claim: mapClaim(claim), evidence, pressure: pressure.results || [], tests: tests.results || [], analyses: analyses || [], lineage }); }
async function claimLineage(env, claimId, evidence, analyses, pressure, tests) { const lineageErrors = []; const truthRows = await safeAll(env, 'truth_claim_links', `SELECT t.id,t.statement,t.category,t.origin,t.truth_type,t.confidence_label,t.repetition_score,t.pressure_score,l.id AS link_id,l.bridge_note,l.created_at AS linked_at FROM truth_claim_links l JOIN truths t ON t.id=l.truth_id WHERE l.claim_id=? ORDER BY l.created_at ASC`, claimId); const directTruthRows = await safeAll(env, 'truths.linked_claim_id', `SELECT t.id,t.statement,t.category,t.origin,t.truth_type,t.confidence_label,t.repetition_score,t.pressure_score,NULL AS link_id,'Linked directly from truth record.' AS bridge_note,t.updated_at AS linked_at FROM truths t WHERE t.linked_claim_id=? ORDER BY t.updated_at ASC`, claimId); if (truthRows.error) lineageErrors.push(truthRows.error); if (directTruthRows.error) lineageErrors.push(directTruthRows.error); const truths = dedupeById([...(truthRows.results || []), ...(directTruthRows.results || [])]); const evidenceLinks = (evidence || []).map(e => ({ id:e.id, title:e.title, stance:e.linked_stance || e.stance || 'support', linkType:e.link_type || 'direct', quality:e.quality || '', sourceUrl:e.source_url || e.sourceUrl || '' })); return { beliefs: [], truths, evidenceLinks, analysisCount:(analyses || []).length, pressureCount:(pressure || []).length, testCount:(tests || []).length, errors: lineageErrors }; }
async function safeAll(env, label, sql, ...args) { try { return await env.DB.prepare(sql).bind(...args).all(); } catch (err) { return { results: [], error: `${label}: ${String(err && err.message ? err.message : err)}` }; } }
function dedupeById(rows) { const seen = new Set(); return (rows || []).filter(row => { if (!row || !row.id || seen.has(row.id)) return false; seen.add(row.id); return true; }); }
async function createClaim(request, env) { const userId = await requireUser(request, env); await safeRateLimit(request, env, `claim:${ip(request)}`,8,3600000); const body = await readJson(request); const claim = cleanText(body.claim,500); if (claim.length < 8) return json({ error:'CLAIM_TOO_SHORT' },400); await ensureUser(env,userId); const now=Date.now(); const claimId=makeId('clm'); const type=cleanText(body.type || 'Physical/Testable',80); const category=cleanText(body.category || inferCategory(claim),80) || 'General'; const testability=inferTestability(type,claim); const normalizedClaim=meaningKey(claim); const existing=await env.DB.prepare(`SELECT c.*, u.handle FROM claims c LEFT JOIN users u ON u.id=c.user_id WHERE c.normalized_claim=? ORDER BY c.created_at ASC LIMIT 1`).bind(normalizedClaim).first(); if (existing) return json({ ok:true, existing:true, claim:mapClaim(existing) }); try { await env.DB.prepare(`INSERT INTO claims (id,user_id,claim,category,type,status,evidence_score,survivability,testability,contradictions,created_at,updated_at,review_state,normalized_claim) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(claimId,userId,claim,category,type,'Plausible',5,50,testability,0,now,now,'review',normalizedClaim).run(); } catch (err) { if (!isUniqueConstraintError(err)) throw err; const raced=await env.DB.prepare(`SELECT c.*, u.handle FROM claims c LEFT JOIN users u ON u.id=c.user_id WHERE c.normalized_claim=? ORDER BY c.created_at ASC LIMIT 1`).bind(normalizedClaim).first(); if (!raced) throw err; return json({ ok:true, existing:true, raced:true, claim:mapClaim(raced) }); } if (body.initialEvidence) { await insertEvidence(env,claimId,userId,'support',cleanText(body.initialEvidence,900),'Initial evidence','testimony',''); await recalcClaimScore(env,claimId); } if (body.claim_builder) { const ctx=cleanClaimBuilderContext(body.claim_builder); if (ctx) { try { await insertClaimBuilderContext(env,makeId,{ targetType:'claim', targetId:claimId, userId, context:ctx }); } catch (cbcErr) { throw new Error(`SERVER_ERROR: builder context insert failed — ${String(cbcErr?.message||cbcErr)}`); } } } let nearDuplicate=false; let similarClaim=null; try { const candidates=await env.DB.prepare(`SELECT id,claim FROM claims WHERE id!=? AND COALESCE(review_state,'public') IN ('public','review') ORDER BY created_at DESC LIMIT 200`).bind(claimId).all(); for (const c of (candidates.results||[])) { if (meaningMatch(claim,c.claim)) { nearDuplicate=true; similarClaim={id:c.id,claim:c.claim}; break; } } if (nearDuplicate) await env.DB.prepare(`UPDATE claims SET near_duplicate_of=? WHERE id=?`).bind(similarClaim.id,claimId).run(); } catch (_) { /* near-duplicate scan is non-fatal */ } const det=await claimDetail(env,claimId); const lin=await claimLineage(env,claimId,det.evidence,det.analyses,det.pressure,det.tests); const claimResp={claim:det.claim,evidence:det.evidence,pressure:det.pressure,tests:det.tests,analyses:det.analyses,lineage:lin}; if (!nearDuplicate) return json(claimResp); return json({...claimResp,nearDuplicate:true,similarClaim}); }
async function addEvidence(request, env) { const userId=await requireUser(request, env); await safeRateLimit(request,env,`evidence:${ip(request)}`,20,3600000); const body=await readJson(request); const claimId=cleanId(body.claimId); const title=cleanText(body.title || 'Evidence',120); const note=cleanText(body.body || body.note || '',1200); if (!claimId || note.length < 3) return json({ error:'BAD_EVIDENCE' },400); await ensureUser(env,userId); const item=await insertEvidence(env,claimId,userId,cleanText(body.stance || 'support',20),note,title,cleanText(body.quality || 'testimony',40),httpUrlOrNull(body.sourceUrl)); await recalcClaimScore(env,claimId); return json({ evidence:item, claim:await claimOnly(env,claimId) }); }
async function addPressure(request, env) { const userId=await requireUser(request, env); await safeRateLimit(request,env,`pressure:${ip(request)}`,20,3600000); const body=await readJson(request); const claimId=cleanId(body.claimId); const title=cleanText(body.title || 'Pressure point',120); const note=cleanText(body.body || body.note || '',1200); if (!claimId || note.length < 3) return json({ error:'BAD_PRESSURE' },400); await ensureUser(env,userId); const now=Date.now(); const pressureId=makeId('prs'); const severity=Math.max(1,Math.min(5,Number(body.severity || 1))); await env.DB.prepare(`INSERT INTO pressure_points (id,claim_id,user_id,title,body,severity,review_state,report_count,updated_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(pressureId,claimId,userId,title,note,severity,'review',0,now,now).run(); return json({ pressure:{ id:pressureId, claim_id:claimId, title, body:note, severity, review_state:'review', report_count:0, created_at:now }, claim:await claimOnly(env,claimId) }); }
async function addHomeTest(request, env) { const userId=await requireUser(request, env); await safeRateLimit(request,env,`tests:${ip(request)}`,20,3600000); const body=await readJson(request); const claimId=cleanId(body.claimId || body.claim_id || ''); const title=cleanText(body.title || 'Home test',160); const instructions=cleanText(body.instructions || body.body || body.note || '',1800); const safetyLevel=cleanText(body.safetyLevel || body.safety_level || 'low',40) || 'low'; const difficulty=cleanText(body.difficulty || 'easy',40) || 'easy'; if (!claimId) return json({ error:'CLAIM_ID_REQUIRED' },400); if (title.length < 3) return json({ error:'TEST_TITLE_TOO_SHORT' },400); if (instructions.length < 8) return json({ error:'TEST_INSTRUCTIONS_TOO_SHORT' },400); const claim=await env.DB.prepare(`SELECT id FROM claims WHERE id=?`).bind(claimId).first(); if (!claim) return json({ error:'CLAIM_NOT_FOUND' },404); await ensureUser(env,userId); const now=Date.now(); const testId=makeId('tst'); await env.DB.prepare(`INSERT INTO home_tests (id,claim_id,user_id,title,instructions,safety_level,difficulty,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(testId,claimId,userId,title,instructions,safetyLevel,difficulty,now,now).run(); const row=await env.DB.prepare(`SELECT t.*, u.handle FROM home_tests t LEFT JOIN users u ON u.id=t.user_id WHERE t.id=?`).bind(testId).first(); return json({ ok:true, test:row, claim:await claimOnly(env,claimId) }); }
async function reportTarget(request, env) { const userId=await requireUser(request, env); await safeRateLimit(request,env,`report:${ip(request)}`,20,3600000); const body=await readJson(request); const targetType=cleanText(body.targetType || 'claim',30); const targetId=cleanId(body.targetId); const reason=cleanText(body.reason || 'Needs review',500); if (!targetId) return json({ error:'BAD_REPORT' },400); await ensureUser(env,userId); const now=Date.now(); await env.DB.prepare(`INSERT INTO reports (id,target_type,target_id,reporter_id,reason,created_at,status) VALUES (?,?,?,?,?,?,?)`).bind(makeId('rpt'),targetType,targetId,userId,reason,now,'open').run(); if (targetType === 'claim') await env.DB.prepare(`UPDATE claims SET report_count=report_count+1, review_state=CASE WHEN report_count+1>=5 THEN 'review' ELSE review_state END WHERE id=?`).bind(targetId).run(); if (targetType === 'evidence') { const evRow=await env.DB.prepare(`SELECT claim_id, report_count FROM evidence WHERE id=?`).bind(targetId).first(); await env.DB.prepare(`UPDATE evidence SET report_count=report_count+1, review_state=CASE WHEN report_count+1>=5 THEN 'review' ELSE review_state END WHERE id=?`).bind(targetId).run(); if (evRow?.claim_id && (evRow.report_count+1)===5) await recalcClaimScore(env, evRow.claim_id).catch(()=>null); } if (targetType === 'pressure') { await env.DB.prepare(`UPDATE pressure_points SET report_count=report_count+1, review_state=CASE WHEN report_count+1>=5 THEN 'review' ELSE review_state END, updated_at=? WHERE id=?`).bind(now,targetId).run(); } return json({ ok:true }); }
async function createAipPacket(request, env) { await safeRateLimit(request,env,`runpack:${ip(request)}`,20,3600000); const body=await readJson(request); const claimId=cleanId(body.claimId); if (!claimId) return json({ error:'BAD_CLAIM_ID' },400); const detail=await claimDetail(env,claimId); if (!detail.claim) return json({ error:'CLAIM_NOT_FOUND' },404); if ((detail.claim.reviewState||'public')!=='public') return json({error:'CLAIM_NOT_FOUND'},404); const packetId=makeId('rp'); const provenance={packet_id:packetId,runpack_version:'1.2',generated_at:new Date().toISOString(),source_claim_id:claimId,source_snapshot_hash:workerSnapshotHash(detail),evidence_count:(detail.evidence||[]).length,pressure_count:(detail.pressure||[]).length,test_count:(detail.tests||[]).length,humanx_worker_version:'v1',is_fallback:false}; const packet=buildRunPack(detail,provenance); await env.DB.prepare(`INSERT INTO aip_packets (id,claim_id,packet_json,created_at) VALUES (?,?,?,?)`).bind(makeId('aip'),claimId,JSON.stringify(packet),Date.now()).run(); return json({ packet }); }
async function reviewDecision(request, env) { const adminError=requireAdmin(request, env); if (adminError) return adminError; const body=await readJson(request); const targetType=cleanText(body.targetType || body.target_type || 'claim',30).toLowerCase(); const targetId=cleanId(body.targetId || body.target_id || ''); const decision=cleanText(body.decision || body.reviewState || body.review_state || '',30).toLowerCase(); const allowed=new Set(['public','review','rejected']); if (!targetId) return json({ error:'TARGET_ID_REQUIRED' },400); if (!allowed.has(decision)) return json({ error:'BAD_REVIEW_DECISION', allowed:[...allowed] },400); const now=Date.now(); if (targetType === 'claim') { await env.DB.prepare(`UPDATE claims SET review_state=?, report_count=0, updated_at=? WHERE id=?`).bind(decision,now,targetId).run(); await env.DB.prepare(`UPDATE reports SET status=? WHERE target_type='claim' AND target_id=? AND status='open'`).bind(decision === 'rejected' ? 'rejected' : 'closed',targetId).run(); const row=await env.DB.prepare(`SELECT c.*, u.handle FROM claims c LEFT JOIN users u ON u.id=c.user_id WHERE c.id=?`).bind(targetId).first(); if (!row) return json({ error:'CLAIM_NOT_FOUND' },404); return json({ ok:true, targetType:'claim', decision, item:mapClaim(row) }); } if (targetType === 'truth') { await env.DB.prepare(`UPDATE truths SET review_state=?, updated_at=? WHERE id=?`).bind(decision,now,targetId).run(); await env.DB.prepare(`UPDATE reports SET status=? WHERE target_type='truth' AND target_id=? AND status='open'`).bind(decision === 'rejected' ? 'rejected' : 'closed',targetId).run().catch(()=>null); const row=await env.DB.prepare(`SELECT * FROM truths WHERE id=?`).bind(targetId).first(); if (!row) return json({ error:'TRUTH_NOT_FOUND' },404); return json({ ok:true, targetType:'truth', decision, item:row }); } if (targetType === 'evidence') { await env.DB.prepare(`UPDATE evidence SET review_state=?, report_count=0 WHERE id=?`).bind(decision,targetId).run(); await env.DB.prepare(`UPDATE reports SET status=? WHERE target_type='evidence' AND target_id=? AND status='open'`).bind(decision === 'rejected' ? 'rejected' : 'closed',targetId).run().catch(()=>null); const row=await env.DB.prepare(`SELECT e.*, c.claim AS parent_claim FROM evidence e LEFT JOIN claims c ON c.id=e.claim_id WHERE e.id=?`).bind(targetId).first(); if (!row) return json({ error:'EVIDENCE_NOT_FOUND' },404); if (row.claim_id) await recalcClaimScore(env, row.claim_id).catch(()=>null); return json({ ok:true, targetType:'evidence', decision, item:row }); } if (targetType === 'pressure') { await env.DB.prepare(`UPDATE pressure_points SET review_state=?, report_count=0, updated_at=? WHERE id=?`).bind(decision,now,targetId).run(); await env.DB.prepare(`UPDATE reports SET status=? WHERE target_type='pressure' AND target_id=? AND status='open'`).bind(decision === 'rejected' ? 'rejected' : 'closed',targetId).run().catch(()=>null); const row=await env.DB.prepare(`SELECT p.*, c.claim AS parent_claim FROM pressure_points p LEFT JOIN claims c ON c.id=p.claim_id WHERE p.id=?`).bind(targetId).first(); if (!row) return json({ error:'PRESSURE_NOT_FOUND' },404); if (row.claim_id) await recalcClaimScore(env, row.claim_id).catch(()=>null); return json({ ok:true, targetType:'pressure', decision, item:row }); } return json({ error:'BAD_REVIEW_TARGET', allowed:['claim','truth','evidence','pressure'] },400); }
async function reviewCleanup(request, env) {
  // ── auth ──────────────────────────────────────────────────────────────────
  const adminError=requireAdmin(request,env); if (adminError) return adminError;
  const body=await readJson(request);
  const targetType=cleanText(body.target_type||'',30).toLowerCase();
  const targetId=cleanId(body.target_id||'');
  if (!targetId) return json({ error:'TARGET_ID_REQUIRED' },400);
  if (!['claim','truth','pressure'].includes(targetType)) return json({ error:'BAD_TARGET_TYPE', allowed:['claim','truth','pressure'] },400);
  // ── fetch row ─────────────────────────────────────────────────────────────
  let row;
  if (targetType==='claim') {
    row=await env.DB.prepare(`SELECT c.id,c.claim,c.review_state,c.status_locked,u.handle,(SELECT tcl.truth_id FROM truth_claim_links tcl WHERE tcl.claim_id=c.id ORDER BY tcl.created_at ASC LIMIT 1) AS source_truth_id FROM claims c LEFT JOIN users u ON u.id=c.user_id WHERE c.id=?`).bind(targetId).first();
    if (!row) return json({ error:'CLAIM_NOT_FOUND' },404);
  } else if (targetType==='pressure') {
    row=await env.DB.prepare(`SELECT p.id,p.title,p.body,p.review_state,u.handle FROM pressure_points p LEFT JOIN users u ON u.id=p.user_id WHERE p.id=?`).bind(targetId).first();
    if (!row) return json({ error:'PRESSURE_NOT_FOUND' },404);
  } else {
    row=await env.DB.prepare(`SELECT id,statement,review_state,status_locked FROM truths WHERE id=?`).bind(targetId).first();
    if (!row) return json({ error:'TRUTH_NOT_FOUND' },404);
  }
  // ── state gate ────────────────────────────────────────────────────────────
  const currentState=row.review_state||'review';
  if (currentState!=='rejected') return json({ error:'CLEANUP_REQUIRES_REJECTED', current_state:currentState },400);
  // ── protected seed blocklist (claims only) ────────────────────────────────
  const PROTECTED_SEEDS=new Set(['clm_seed_55e17c22e13e','clm_seed_8e095b6f6d30','clm_seed_c4e0335e7aae','clm_seed_8ad9ff121579','clm_seed_7fb1c24747c2']);
  if (PROTECTED_SEEDS.has(targetId)) return json({ error:'CLEANUP_PROTECTED_SEED' },400);
  // ── status lock gate (claims and truths only — pressure_points has no status_locked) ────
  if (row.status_locked) return json({ error:'CLEANUP_REQUIRES_NOT_LOCKED' },400);
  // ── artefact detection (v2) ───────────────────────────────────────────────
  const id=row.id||'';
  const handle=String(row.handle||'').toLowerCase();
  // pressure items expose title+body; claims use claim text; truths use statement
  const rawText=targetType==='pressure'
    ? String((row.title||'')+' '+(row.body||'')).trim()
    : String(row.claim||row.statement||'');
  const text=rawText.toLowerCase();
  // signal 1: text keywords (original)
  const keywordMatch=text.includes('smoke')||/\btest\b/.test(text)||text.includes('automated write')||text.includes('automated smoke');
  // signal 2: id pattern — only meaningful for claim seeds, not for pressure (prs_ prefix is always present)
  const idPatternMatch=targetType!=='pressure'&&(/^clm_seed_/.test(id)||/^HX-\d/i.test(id));
  // signal 3: known dev/test handles
  const DEV_HANDLES=new Set(['humanx-seed','anon-o_seed','anon-xksavy','anon-73d9y2','anon-ek3562']);
  const handleMatch=DEV_HANDLES.has(handle);
  // signal 4: truth-derived from a seed truth (source_truth_id starts with tru_seed_) — claim type only
  const sourceTruthSeedMatch=targetType==='claim'&&/^tru_seed_/.test(row.source_truth_id||'');
  const isArtefact=keywordMatch||idPatternMatch||handleMatch||sourceTruthSeedMatch;
  if (isArtefact) {
    // normal archive path
    const archiveCategory=keywordMatch?'test_keyword':idPatternMatch?'dev_seed_id':handleMatch?'dev_handle':'seed_truth_derived';
    const now=Date.now();
    if (targetType==='claim') { await env.DB.prepare(`UPDATE claims SET review_state='archived',updated_at=? WHERE id=?`).bind(now,targetId).run(); }
    else if (targetType==='pressure') { await env.DB.prepare(`UPDATE pressure_points SET review_state='archived',updated_at=? WHERE id=?`).bind(now,targetId).run(); }
    else { await env.DB.prepare(`UPDATE truths SET review_state='archived',updated_at=? WHERE id=?`).bind(now,targetId).run(); }
    return json({ ok:true, target_type:targetType, target_id:targetId, action:'archived', previous_state:currentState, new_state:'archived', archive_policy:'test_artifact_v2', archive_reason:archiveCategory });
  }
  // ── junk override path ────────────────────────────────────────────────────
  const junkOverride=body.junk_override===true||body.junk_override==='true';
  if (junkOverride) {
    const reason=cleanText(String(body.reason||'').trim(),240);
    if (!reason||reason.length<8) return json({ error:'CLEANUP_REASON_REQUIRED', message:'reason must be at least 8 characters' },400);
    // conservative junk heuristic: short text, all-caps fragment, or low-alpha gibberish
    const trimmed=rawText.trim();
    const isShort=trimmed.length<=40;
    const isAllCapsFragment=/^[A-Z0-9\s!?.,'"-]{1,40}$/.test(trimmed)&&/^[A-Z]/.test(trimmed)&&trimmed===trimmed.toUpperCase()&&trimmed.split(/\s+/).length<=3;
    const alphaChars=(trimmed.match(/[a-zA-Z]/g)||[]).length;
    const totalChars=trimmed.replace(/\s/g,'').length||1;
    const alphaRatio=alphaChars/totalChars;
    const isLowAlpha=alphaRatio<0.6&&trimmed.length>3;
    const junkHeuristicPass=isShort||isAllCapsFragment||isLowAlpha;
    if (!junkHeuristicPass) return json({ error:'CLEANUP_JUNK_OVERRIDE_REJECTED', message:'junk_override heuristic did not match — use normal archive path or review this item manually' },400);
    const now=Date.now();
    if (targetType==='claim') { await env.DB.prepare(`UPDATE claims SET review_state='archived',updated_at=? WHERE id=?`).bind(now,targetId).run(); }
    else if (targetType==='pressure') { await env.DB.prepare(`UPDATE pressure_points SET review_state='archived',updated_at=? WHERE id=?`).bind(now,targetId).run(); }
    else { await env.DB.prepare(`UPDATE truths SET review_state='archived',updated_at=? WHERE id=?`).bind(now,targetId).run(); }
    return json({ ok:true, target_type:targetType, target_id:targetId, action:'archived', previous_state:currentState, new_state:'archived', archive_policy:'junk_override_v1', archive_reason:reason });
  }
  // ── no signal matched ─────────────────────────────────────────────────────
  return json({ error:'CLEANUP_REQUIRES_TEST_ARTEFACT' },400);
}
async function markDuplicate(request, env) { const adminError=requireAdmin(request,env); if (adminError) return adminError; const body=await readJson(request); const claimId=cleanId(body.claimId||body.claim_id||''); const duplicateOf=cleanId(body.duplicateOf||body.duplicate_of||''); const reason=cleanText(body.reason||'',500); if (!claimId) return json({ error:'CLAIM_ID_REQUIRED' },400); if (!duplicateOf) return json({ error:'DUPLICATE_OF_REQUIRED' },400); if (claimId===duplicateOf) return json({ error:'SELF_DUPLICATE_NOT_ALLOWED' },400); const source=await env.DB.prepare(`SELECT id,claim,review_state FROM claims WHERE id=?`).bind(claimId).first(); if (!source) return json({ error:'CLAIM_NOT_FOUND' },404); if (new Set(['archived','duplicate']).has(source.review_state||'')) return json({ error:'CLAIM_NOT_ELIGIBLE', current_state:source.review_state },400); const target=await env.DB.prepare(`SELECT id FROM claims WHERE id=?`).bind(duplicateOf).first(); if (!target) return json({ error:'DUPLICATE_TARGET_NOT_FOUND' },404); const now=Date.now(); await env.DB.prepare(`UPDATE claims SET duplicate_of=?,review_state='duplicate',updated_at=? WHERE id=?`).bind(duplicateOf,now,claimId).run(); const updated=await env.DB.prepare(`SELECT c.*,u.handle FROM claims c LEFT JOIN users u ON u.id=c.user_id WHERE c.id=?`).bind(claimId).first(); return json({ ok:true, action:'marked_duplicate', claimId, duplicateOf, reason:reason||null, review_state:'duplicate', item:mapClaim(updated) }); }
async function resolveSimilar(request, env) { const adminError=requireAdmin(request,env); if (adminError) return adminError; const body=await readJson(request); const claimId=cleanId(body.claimId||body.claim_id||''); if (!claimId) return json({ error:'CLAIM_ID_REQUIRED' },400); const source=await env.DB.prepare(`SELECT id,near_duplicate_of FROM claims WHERE id=?`).bind(claimId).first(); if (!source) return json({ error:'CLAIM_NOT_FOUND' },404); if (!source.near_duplicate_of) return json({ error:'NO_SIMILAR_ADVISORY', message:'near_duplicate_of is not set on this claim' },400); const previous=source.near_duplicate_of; const now=Date.now(); await env.DB.prepare(`UPDATE claims SET near_duplicate_of=NULL,updated_at=? WHERE id=?`).bind(now,claimId).run(); return json({ ok:true, action:'resolved_similar', claimId, previous_near_duplicate_of:previous }); }
async function reviewQueue(request, env) { const adminError=requireAdmin(request, env); if (adminError) return adminError; const claims=await env.DB.prepare(`SELECT 'claim' AS target_type, c.*, u.handle, (SELECT tcl.truth_id FROM truth_claim_links tcl WHERE tcl.claim_id=c.id ORDER BY tcl.created_at ASC LIMIT 1) AS source_truth_id, (SELECT r.reason FROM reports r WHERE r.target_type='claim' AND r.target_id=c.id AND r.status='open' ORDER BY r.created_at DESC LIMIT 1) AS latest_report_reason FROM claims c LEFT JOIN users u ON u.id=c.user_id WHERE COALESCE(c.review_state,'public') NOT IN ('archived','duplicate','rejected') AND (COALESCE(c.review_state,'public')!='public' OR c.report_count>0) ORDER BY c.updated_at DESC LIMIT 100`).all(); const truths=await env.DB.prepare(`SELECT 'truth' AS target_type, t.*, c.review_state AS linked_claim_review_state, (SELECT r.reason FROM reports r WHERE r.target_type='truth' AND r.target_id=t.id AND r.status='open' ORDER BY r.created_at DESC LIMIT 1) AS latest_report_reason FROM truths t LEFT JOIN claims c ON c.id=t.linked_claim_id WHERE COALESCE(t.review_state,'public') NOT IN ('public','archived','rejected') AND (t.linked_claim_id IS NULL OR c.id IS NOT NULL) ORDER BY t.updated_at DESC LIMIT 100`).all(); const evidenceItems=await env.DB.prepare(`SELECT 'evidence' AS target_type, e.id, e.claim_id, e.user_id, e.title, e.body, e.source_url, e.stance, e.quality, e.review_state, e.report_count, e.created_at, u.handle, c.claim AS parent_claim, (SELECT r.reason FROM reports r WHERE r.target_type='evidence' AND r.target_id=e.id AND r.status='open' ORDER BY r.created_at DESC LIMIT 1) AS latest_report_reason FROM evidence e LEFT JOIN claims c ON c.id=e.claim_id LEFT JOIN users u ON u.id=e.user_id WHERE COALESCE(e.review_state,'public') NOT IN ('public','archived') OR e.report_count>0 ORDER BY e.created_at DESC LIMIT 100`).all(); const pressureItems=await env.DB.prepare(`SELECT 'pressure' AS target_type, p.id, p.claim_id, p.title, p.body, p.severity, p.review_state, p.report_count, p.created_at, p.updated_at, c.claim AS parent_claim, u.handle FROM pressure_points p LEFT JOIN claims c ON c.id=p.claim_id LEFT JOIN users u ON u.id=p.user_id WHERE COALESCE(p.review_state,'public') NOT IN ('public','archived') OR p.report_count>0 ORDER BY p.created_at DESC LIMIT 100`).all(); const claimRows=claims.results || []; const truthRows=truths.results || []; const evidenceRows=evidenceItems.results || []; const pressureRows=pressureItems.results || []; await attachClaimBuilderContexts(env, claimRows, truthRows); // Each source query is individually capped at LIMIT 100 (up to 400 rows total).
  // Combined here, globally sorted descending by updated_at (falls back to created_at —
  // evidence rows always use created_at because the evidence table has no updated_at column),
  // then sliced to 100. Intentional: keeps the payload small; older low-activity items
  // are visible via type-specific filters on the frontend.
  const review=[...claimRows,...truthRows,...evidenceRows,...pressureRows].sort((a,b)=>((b.updated_at||b.created_at||0))-((a.updated_at||a.created_at||0))).slice(0,100); let archivedMeta={archived_total:0,archived_claims:0,archived_truths:0,duplicate_total:0}; try { const ac=await env.DB.prepare(`SELECT COUNT(*) AS n FROM claims WHERE review_state='archived'`).first(); const at=await env.DB.prepare(`SELECT COUNT(*) AS n FROM truths WHERE review_state='archived'`).first(); archivedMeta={archived_claims:ac?.n||0,archived_truths:at?.n||0,archived_total:(ac?.n||0)+(at?.n||0)};const dc=await env.DB.prepare(`SELECT COUNT(*) AS n FROM claims WHERE review_state='duplicate'`).first();archivedMeta.duplicate_total=dc?.n||0; } catch(_) { /* non-fatal: return zero counts if query fails */ } return json({ claims:claimRows, truths:truthRows, evidence:evidenceRows, pressure:pressureRows, review, ...archivedMeta }); }
async function insertEvidence(env, claimId, userId, stance, body, title, quality, sourceUrl, reviewState='review') { const now=Date.now(); const evidenceId=makeId('evd'); await env.DB.prepare(`INSERT INTO evidence (id,claim_id,user_id,stance,quality,title,body,source_url,created_at,review_state) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(evidenceId,claimId,userId,stance,quality,title,body,sourceUrl,now,reviewState).run(); return { id:evidenceId, claim_id:claimId, stance, quality, title, body, source_url:sourceUrl, created_at:now, review_state:reviewState }; }
async function claimOnly(env, claimId) { const row=await env.DB.prepare(`SELECT c.*, u.handle FROM claims c LEFT JOIN users u ON u.id=c.user_id WHERE c.id=?`).bind(claimId).first(); return mapClaim(row); }
async function claimDetail(env, claimId) { const claim=await claimOnly(env,claimId); const analyses=await listAnalysisForClaim(env,claimId); const directEvidence=await env.DB.prepare(`SELECT id, created_at, title, body, quality, source_url, stance, 'direct' AS link_type, NULL AS linked_stance, NULL AS link_note FROM evidence WHERE claim_id=? AND COALESCE(review_state,'public')='public'`).bind(claimId).all(); const reusedEvidence=await env.DB.prepare(`SELECT e.id, e.created_at, e.title, e.body, e.quality, e.source_url, e.stance, 'reused' AS link_type, l.stance AS linked_stance, l.link_note FROM evidence_claim_links l JOIN evidence e ON e.id=l.evidence_id WHERE l.claim_id=? AND COALESCE(e.review_state,'public')='public'`).bind(claimId).all(); const evidence=[...(directEvidence.results || []),...(reusedEvidence.results || [])]; const pressure=await env.DB.prepare(`SELECT id, created_at, title, body, severity FROM pressure_points WHERE claim_id=? AND COALESCE(review_state,'public')='public' ORDER BY created_at DESC`).bind(claimId).all(); const tests=await env.DB.prepare(`SELECT id, updated_at, created_at, title, instructions, safety_level, difficulty FROM home_tests WHERE claim_id=? ORDER BY created_at DESC`).bind(claimId).all(); return { claim, evidence, pressure:pressure.results || [], tests:tests.results || [], analyses:analyses || [] }; }
function workerSnapshotHash(detail) { const {claim,evidence,pressure,tests}=detail; const eids=(evidence||[]).map(e=>e.id||'').sort().join(','); const euas=(evidence||[]).map(e=>String(e.created_at||'')).sort().join(','); const pids=(pressure||[]).map(p=>p.id||'').sort().join(','); const puas=(pressure||[]).map(p=>String(p.created_at||'')).sort().join(','); const tids=(tests||[]).map(t=>t.id||'').sort().join(','); const tuas=(tests||[]).map(t=>String(t.updated_at||t.created_at||'')).sort().join(','); const s=[claim.id||'',String(claim.updated_at||''),eids,euas,pids,puas,tids,tuas].join('|'); let h=0; for(let i=0;i<s.length;i++){h=(Math.imul(31,h)+s.charCodeAt(i))|0;} return(h>>>0).toString(16); }
function buildRunPack(detail, provenance) { return { ...(provenance||{}), legacy_aip_version:'1.1', aip_version:'1.1', packet_type:'runpack_task', app:'HumanX', mode:'claim-pressure-analysis', no_owner_api_used:true, instruction:'Analyse this claim using only the provided packet and your own reasoning. Identify what is proven, weak, contradicted, untestable, or needs better evidence. Do not assume the claim is true because it is emotionally important. Do not dismiss it only because it is unpopular.', output_contract:{ verdict:'Proven | Strongly Supported | Plausible | Untestable | Weak Evidence | Disproven | Reality Collapse', evidence_score:'0-100', testability:'0-100', survivability:'0-100', strongest_support:'array', strongest_pressure:'array', missing_tests:'array', plain_language_summary:'string' }, payload:detail }; }
async function safeRateLimit(request, env, rateKey, maxHits, windowMs) { try { const now=Date.now(); const row=await env.DB.prepare(`SELECT hits, window_start FROM rate_limits WHERE "key"=?`).bind(rateKey).first(); if (!row || now-row.window_start>windowMs) { await env.DB.prepare(`INSERT OR REPLACE INTO rate_limits ("key",hits,window_start) VALUES (?,?,?)`).bind(rateKey,1,now).run(); return; } if (row.hits >= maxHits) throw new Error('RATE_LIMITED'); await env.DB.prepare(`UPDATE rate_limits SET hits=hits+1 WHERE "key"=?`).bind(rateKey).run(); } catch (err) { const message=String(err && err.message ? err.message : err); if (message.includes('RATE_LIMITED')) throw err; throw new Error(`RATE_LIMIT_UNAVAILABLE: ${message}`); } }
async function ensureUser(env, userId) { const existing=await env.DB.prepare(`SELECT id FROM users WHERE id=?`).bind(userId).first(); if (!existing) await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at) VALUES (?, ?, ?)`).bind(userId,`anon-${userId.slice(-6)}`,Date.now()).run(); }
function isUniqueConstraintError(err) { const message=String(err && err.message ? err.message : err).toLowerCase(); if (message.includes('foreign key')) return false; return message.includes('unique') || message.includes('constraint failed'); }
function fallbackApi(request, url) { if (url.pathname === '/api/claims') return json({ claims:demoClaims(), warning:'D1 binding missing. Add DB binding in Cloudflare to make this shared/public.' }); if (url.pathname === '/api/session') return json({ user:{ id:'demo-user', handle:'demo-user', trust_score:0, strike_count:0 } }); return json({ error:'D1_NOT_CONNECTED', message:'HumanX backend code is ready, but Cloudflare D1 binding DB has not been connected yet.' },503); }
function mapClaims(rows) { return rows.map(mapClaim); }
function mapClaim(c) { if (!c) return null; return { id:c.id, claim:c.claim, category:c.category, type:c.type, status:c.status, evidenceScore:c.evidence_score ?? c.evidenceScore, survivability:c.survivability, testability:c.testability, contradictions:c.contradictions, reportCount:c.report_count || 0, reviewState:c.review_state || 'public', beliefYes:c.belief_yes || 0, beliefNo:c.belief_no || 0, uncertainty:c.uncertainty || 0, createdAt:c.created_at, updatedAt:c.updated_at, handle:c.handle || 'anon', nearDuplicateOf:c.near_duplicate_of||null, duplicateOf:c.duplicate_of||null, statusLocked:!!(c.status_locked) }; }
function demoClaims() { return [{ id:'HX-000001', claim:'The Earth is flat', category:'Cosmology', type:'Physical/Testable', status:'Disproven', evidenceScore:4, testability:98, survivability:2, contradictions:214, handle:'demo' },{ id:'HX-000002', claim:'Humans landed on the Moon', category:'History/Space', type:'Historical', status:'Strongly Supported', evidenceScore:94, testability:82, survivability:91, contradictions:7, handle:'demo' },{ id:'HX-000003', claim:'A dream predicted my future', category:'Belief', type:'Religious/Belief', status:'Untestable', evidenceScore:18, testability:7, survivability:48, contradictions:3, handle:'demo' }]; }
async function readJson(request) { try { return await request.json(); } catch { return {}; } }
function json(data, status=200) { return new Response(JSON.stringify(data,null,2),{ status, headers:{ 'content-type':'application/json; charset=utf-8', ...CORS } }); }
function requireUserId(request) { const userId=cleanId(request.headers.get('x-humanx-user')||''); if (!userId) throw new Error('MISSING_PSEUDONYMOUS_USER'); return userId; }
async function requireUser(request, env) { const userId=requireUserId(request); if (env?.DB) { const row=await env.DB.prepare(`SELECT is_shadow_banned FROM users WHERE id=?`).bind(userId).first(); if (Number(row?.is_shadow_banned||0)===1) throw new Error('USER_SHADOW_BANNED'); } return userId; }
function safeEqual(a, b) { const x=String(a==null?'':a); const y=String(b==null?'':b); if (!x.length || !y.length) return false; const n=Math.max(x.length, y.length); let diff=x.length ^ y.length; for (let i=0;i<n;i++){ diff |= (x.charCodeAt(i)||0) ^ (y.charCodeAt(i)||0); } return diff === 0; }
function requireAdmin(request, env) { const admin=request.headers.get('x-humanx-admin') || ''; const expected=env.HUMANX_ADMIN_TOKEN || ''; if (!expected || !safeEqual(admin, expected)) return json({ error:'ADMIN_REQUIRED' },403); return null; }
function makeId(prefix) { return `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0,18)}`; }
function cleanId(v) { return String(v || '').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80); }
function cleanText(v,max) { return String(v || '').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max); }
function httpUrlOrNull(url) { const s = cleanText(url, 500); if (!s) return null; try { const u = new URL(s); return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : null; } catch (_) { return null; } }
function cleanHandle(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,24); }
function ip(request) { return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown'; }
function inferCategory(claim) { return claim.toLowerCase().includes('god') ? 'Belief' : claim.toLowerCase().includes('moon') ? 'History/Space' : 'General'; }
function inferTestability(type, claim) { if (type.includes('Religious') || /dream|soul|spirit|god/i.test(claim)) return 8; if (type.includes('Historical')) return 65; if (type.includes('Medical')) return 85; return 75; }
