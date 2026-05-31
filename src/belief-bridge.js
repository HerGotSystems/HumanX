import { meaningKey } from './meaning-key.js';

export async function promoteBeliefSnapshot(request, env, helpers) {
  const { readJson, cleanId, cleanText, json, requireUser, makeId } = helpers;
  const userId = requireUser(request);
  await safeRateLimit(request, env, `belief-promote:${ip(request)}`, 10, 3600000);
  const body = await readJson(request);
  const snapshotId = cleanId(body.snapshotId || body.snapshot_id || '');
  const target = cleanText(body.target || 'truth', 20).toLowerCase();
  if (!snapshotId) return json({ error: 'SNAPSHOT_ID_REQUIRED' }, 400);
  if (target !== 'truth' && target !== 'claim') return json({ error: 'BAD_PROMOTION_TARGET' }, 400);

  const snap = await env.DB.prepare(`SELECT * FROM belief_snapshots WHERE id=? AND user_id=?`).bind(snapshotId, userId).first();
  if (!snap) return json({ error: 'SNAPSHOT_NOT_FOUND' }, 404);

  const raw = safeParse(snap.raw_json) || {};
  const topBeliefs = safeParse(snap.top_beliefs_json) || [];
  const first = topBeliefs[0] || {};
  const statement = cleanText(body.statement || first.statement || raw.statement || snap.label || '', 500);
  if (statement.length < 4) return json({ error: 'PROMOTION_STATEMENT_TOO_SHORT' }, 400);

  await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at) VALUES (?, ?, ?)`)
    .bind(userId, `anon-${userId.slice(-6)}`, Date.now())
    .run();

  if (target === 'truth') return promoteToTruth(env, json, helpers, userId, snap, statement, body);
  return promoteToClaim(env, json, helpers, userId, snap, statement, body);
}

async function promoteToTruth(env, json, helpers, userId, snap, statement, body) {
  const { cleanText, cleanId, makeId } = helpers;
  const normalized = normalizeStatement(statement);
  const now = Date.now();
  const existing = await env.DB.prepare(`SELECT * FROM truths WHERE normalized_statement=?`).bind(normalized).first();

  if (existing) {
    await env.DB.prepare(`UPDATE truths SET repetition_score=repetition_score+1, updated_at=? WHERE id=?`).bind(now, existing.id).run();
    const row = await env.DB.prepare(`SELECT * FROM truths WHERE id=?`).bind(existing.id).first();
    return json({ ok: true, target: 'truth', existing: true, truth: mapTruth(row) });
  }

  const linkedClaim = await findExistingClaim(env, statement);
  const id = makeId('tru');
  try {
    await env.DB.prepare(`
      INSERT INTO truths (
        id,user_id,statement,normalized_statement,category,origin,truth_type,
        confidence_label,repetition_score,pressure_score,linked_claim_id,
        created_at,updated_at,review_state
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      id,
      userId,
      statement,
      normalized,
      cleanText(body.category || 'belief', 80),
      cleanText(body.origin || snap.source || 'belief snapshot', 120),
      cleanText(body.truthType || body.truth_type || 'personal-belief', 60),
      confidenceLabel(snap),
      1,
      Number(snap.pressure_score || 0),
      cleanId(body.linkedClaimId || body.linked_claim_id || linkedClaim?.id || ''),
      now,
      now,
      'review'
    ).run();
  } catch (err) {
    if (!isUniqueConstraintError(err)) throw err;
    const raced = await env.DB.prepare(`SELECT * FROM truths WHERE normalized_statement=?`).bind(normalized).first();
    if (raced) {
      await env.DB.prepare(`UPDATE truths SET repetition_score=repetition_score+1, updated_at=? WHERE id=?`).bind(now, raced.id).run();
      if (linkedClaim?.id) await linkTruthToClaim(env, helpers, raced.id, linkedClaim.id, userId, 'Raced belief truth matched to existing claim.', now);
      const row = await env.DB.prepare(`SELECT * FROM truths WHERE id=?`).bind(raced.id).first();
      return json({ ok: true, target: 'truth', existing: true, truth: mapTruth(row) });
    }
    throw err;
  }

  if (linkedClaim?.id) await linkTruthToClaim(env, helpers, id, linkedClaim.id, userId, 'Belief truth matched to existing claim.', now);

  const row = await env.DB.prepare(`SELECT * FROM truths WHERE id=?`).bind(id).first();
  return json({ ok: true, target: 'truth', existing: false, linkedClaimId: linkedClaim?.id || '', truth: mapTruth(row) });
}

async function promoteToClaim(env, json, helpers, userId, snap, statement, body) {
  const { cleanText, makeId } = helpers;
  const now = Date.now();
  const existing = await findExistingClaim(env, statement);
  if (existing) return json({ ok: true, target: 'claim', existing: true, claimId: existing.id, claim: mapClaim(existing) });

  const id = makeId('clm');
  const type = cleanText(body.type || 'Belief/Testable', 80);
  const testability = inferTestability(statement, type, snap);
  const evidenceScore = Math.max(1, Math.min(100, Number(snap.stability_score || 5)));
  const pressure = Number(snap.pressure_score || 0);
  const survivability = Math.max(0, Math.min(100, Math.round(evidenceScore - pressure * 0.4 + testability * 0.25)));
  const status = testability < 15 ? 'Untestable' : evidenceScore > 65 ? 'Plausible' : 'Weak Evidence';
  const normalizedClaim = normalizeClaim(statement);

  let claimId = id;
  try {
    await insertClaimWithNormalizedKey(env, {
      id,
      userId,
      statement,
      category: cleanText(body.category || 'Belief', 80),
      type,
      status,
      evidenceScore,
      survivability,
      testability,
      contradictions: pressure > 55 ? 1 : 0,
      now,
      normalizedClaim
    });
  } catch (err) {
    if (!isUniqueConstraintError(err)) throw err;
    const raced = await env.DB.prepare(`SELECT * FROM claims WHERE normalized_claim=? ORDER BY created_at ASC LIMIT 1`).bind(normalizedClaim).first();
    if (!raced) throw err;
    claimId = raced.id;
    const matchingTruths = await env.DB.prepare(`SELECT id FROM truths WHERE normalized_statement=?`).bind(normalizeStatement(statement)).all();
    await env.DB.prepare(`UPDATE truths SET linked_claim_id=?, updated_at=? WHERE normalized_statement=? AND (linked_claim_id IS NULL OR linked_claim_id='')`)
      .bind(claimId, now, normalizeStatement(statement))
      .run();
    for (const truth of matchingTruths.results || []) {
      await linkTruthToClaim(env, helpers, truth.id, claimId, userId, 'Belief claim promoted from matching truth statement.', now);
    }
    const racedRow = await env.DB.prepare(`SELECT * FROM claims WHERE id=?`).bind(claimId).first();
    return json({ ok: true, target: 'claim', existing: true, claimId, claim: mapClaim(racedRow) });
  }

  await env.DB.prepare(`INSERT INTO evidence (id,claim_id,user_id,stance,quality,title,body,source_url,created_at) VALUES (?,?,?,?,?,?,?,?,?)`)
    .bind(makeId('evd'), claimId, userId, 'support', 'testimony', 'Belief snapshot origin', cleanText(snap.summary || 'Claim created from a personal belief snapshot.', 1200), '', now)
    .run();

  const matchingTruths = await env.DB.prepare(`SELECT id FROM truths WHERE normalized_statement=?`).bind(normalizeStatement(statement)).all();
  await env.DB.prepare(`UPDATE truths SET linked_claim_id=?, updated_at=? WHERE normalized_statement=? AND (linked_claim_id IS NULL OR linked_claim_id='')`)
    .bind(claimId, now, normalizeStatement(statement))
    .run();

  for (const truth of matchingTruths.results || []) {
    await linkTruthToClaim(env, helpers, truth.id, claimId, userId, 'Belief claim promoted from matching truth statement.', now);
  }

  const row = await env.DB.prepare(`SELECT * FROM claims WHERE id=?`).bind(claimId).first();
  return json({ ok: true, target: 'claim', existing: false, claimId, claim: mapClaim(row) });
}

async function linkTruthToClaim(env, helpers, truthId, claimId, userId, note, now = Date.now()) {
  const { cleanText, makeId } = helpers;
  const existing = await env.DB.prepare(`SELECT id FROM truth_claim_links WHERE truth_id=? AND claim_id=? LIMIT 1`).bind(truthId, claimId).first();
  if (!existing) {
    await env.DB.prepare(`
      INSERT OR IGNORE INTO truth_claim_links (
        id,truth_id,claim_id,user_id,bridge_note,created_at
      ) VALUES (?,?,?,?,?,?)
    `).bind(makeId('tcl'), truthId, claimId, userId, cleanText(note, 400), now).run();
  }
  await syncTruthLinkState(env, truthId, claimId, now);
}

async function syncTruthLinkState(env, truthId, claimId, now) {
  const countRow = await env.DB.prepare(`SELECT COUNT(*) AS n FROM truth_claim_links WHERE truth_id=?`).bind(truthId).first();
  await env.DB.prepare(`
    UPDATE truths
    SET converted_claim_count=?,
        linked_claim_id=COALESCE(linked_claim_id, ?),
        updated_at=?
    WHERE id=?
  `).bind(countRow?.n || 0, claimId, now, truthId).run();
}

async function insertClaimWithNormalizedKey(env, c) {
  await env.DB.prepare(`INSERT INTO claims (id,user_id,claim,category,type,status,evidence_score,survivability,testability,contradictions,created_at,updated_at,review_state,normalized_claim) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(c.id, c.userId, c.statement, c.category, c.type, c.status, c.evidenceScore, c.survivability, c.testability, c.contradictions, c.now, c.now, 'review', c.normalizedClaim)
    .run();
}

async function findExistingClaim(env, statement) {
  const normalized = normalizeClaim(statement);
  return await env.DB.prepare(`SELECT * FROM claims WHERE normalized_claim=? ORDER BY created_at ASC LIMIT 1`).bind(normalized).first();
}

function isUniqueConstraintError(err) {
  const message = String(err && err.message ? err.message : err).toLowerCase();
  return message.includes('unique') || message.includes('constraint') || message.includes('constraint failed');
}

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

function ip(request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
}

function confidenceLabel(snap) {
  const raw = safeParse(snap.raw_json) || {};
  const c = Number(raw.confidence || 0);
  if (c >= 80) return 'strongly held';
  if (c >= 55) return 'held';
  if (c >= 30) return 'uncertain';
  return 'weakly held';
}

function inferTestability(statement, type, snap) {
  if (/god|soul|spirit|afterlife|meaning|evil|sacred/i.test(statement)) return 8;
  if (type.includes('Belief')) return Math.max(15, Math.min(80, 100 - Number(snap.pressure_score || 0)));
  return 65;
}

function mapTruth(t) {
  if (!t) return null;
  return {
    id: t.id,
    statement: t.statement,
    category: t.category,
    origin: t.origin,
    truthType: t.truth_type,
    confidenceLabel: t.confidence_label,
    repetitionScore: t.repetition_score || 1,
    pressureScore: t.pressure_score || 0,
    linkedClaimId: t.linked_claim_id,
    reviewState: t.review_state || 'review',
    createdAt: t.created_at,
    updatedAt: t.updated_at
  };
}

function mapClaim(c) {
  if (!c) return null;
  return {
    id: c.id,
    claim: c.claim,
    category: c.category,
    type: c.type,
    status: c.status,
    evidenceScore: c.evidence_score,
    survivability: c.survivability,
    testability: c.testability,
    contradictions: c.contradictions,
    reviewState: c.review_state || 'review',
    createdAt: c.created_at,
    updatedAt: c.updated_at
  };
}

function safeParse(v) {
  try { return JSON.parse(v); } catch { return null; }
}

function normalizeStatement(v) {
  return meaningKey(v);
}

function normalizeClaim(v) {
  return meaningKey(v);
}
