export async function promoteBeliefSnapshot(request, env, helpers) {
  const { readJson, cleanId, cleanText, json, requireUser, makeId } = helpers;
  const userId = requireUser(request);
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
  const normalized = normalize(statement);
  const now = Date.now();
  const existing = await env.DB.prepare(`SELECT * FROM truths WHERE normalized_statement=?`).bind(normalized).first();

  if (existing) {
    await env.DB.prepare(`UPDATE truths SET repetition_score=repetition_score+1, updated_at=? WHERE id=?`).bind(now, existing.id).run();
    const row = await env.DB.prepare(`SELECT * FROM truths WHERE id=?`).bind(existing.id).first();
    return json({ ok: true, target: 'truth', existing: true, truth: mapTruth(row) });
  }

  const id = makeId('tru');
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
    cleanId(body.linkedClaimId || body.linked_claim_id || ''),
    now,
    now,
    'public'
  ).run();

  const row = await env.DB.prepare(`SELECT * FROM truths WHERE id=?`).bind(id).first();
  return json({ ok: true, target: 'truth', existing: false, truth: mapTruth(row) });
}

async function promoteToClaim(env, json, helpers, userId, snap, statement, body) {
  const { cleanText, makeId } = helpers;
  const normalized = normalizeClaim(statement);
  const now = Date.now();
  const rows = await env.DB.prepare(`SELECT * FROM claims ORDER BY created_at DESC LIMIT 300`).all();
  const existing = (rows.results || []).find(c => normalizeClaim(c.claim) === normalized);
  if (existing) return json({ ok: true, target: 'claim', existing: true, claimId: existing.id, claim: mapClaim(existing) });

  const id = makeId('clm');
  const type = cleanText(body.type || 'Belief/Testable', 80);
  const testability = inferTestability(statement, type, snap);
  const evidenceScore = Math.max(1, Math.min(100, Number(snap.stability_score || 5)));
  const pressure = Number(snap.pressure_score || 0);
  const survivability = Math.max(0, Math.min(100, Math.round(evidenceScore - pressure * 0.4 + testability * 0.25)));
  const status = testability < 15 ? 'Untestable' : evidenceScore > 65 ? 'Plausible' : 'Weak Evidence';

  await env.DB.prepare(`INSERT INTO claims (id,user_id,claim,category,type,status,evidence_score,survivability,testability,contradictions,created_at,updated_at,review_state) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id, userId, statement, cleanText(body.category || 'Belief', 80), type, status, evidenceScore, survivability, testability, pressure > 55 ? 1 : 0, now, now, 'public')
    .run();

  await env.DB.prepare(`INSERT INTO evidence (id,claim_id,user_id,stance,quality,title,body,source_url,created_at) VALUES (?,?,?,?,?,?,?,?,?)`)
    .bind(makeId('evd'), id, userId, 'support', 'testimony', 'Belief snapshot origin', cleanText(snap.summary || 'Claim created from a personal belief snapshot.', 1200), '', now)
    .run();

  const row = await env.DB.prepare(`SELECT * FROM claims WHERE id=?`).bind(id).first();
  return json({ ok: true, target: 'claim', existing: false, claimId: id, claim: mapClaim(row) });
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
    createdAt: c.created_at,
    updatedAt: c.updated_at
  };
}

function safeParse(v) {
  try { return JSON.parse(v); } catch { return null; }
}

function normalize(v) {
  return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeClaim(v) {
  return normalize(v)
    .replace(/\bthis statement reflects reality consistently enough to survive evidence and repeatable pressure testing\b/g, '')
    .replace(/\bclaim\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
