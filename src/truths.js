import { meaningKey } from './meaning-key.js';

export async function listTruths(request, env, helpers) {
  const { json } = helpers;
  const url = new URL(request.url);
  const q = `%${String(url.searchParams.get('q') || '').slice(0, 80)}%`;
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 60)));

  const rows = await env.DB.prepare(`
    SELECT t.*, u.handle
    FROM truths t
    LEFT JOIN users u ON u.id=t.user_id
    WHERE COALESCE(t.review_state,'public')='public'
      AND (t.statement LIKE ? OR t.category LIKE ? OR t.origin LIKE ? OR t.truth_type LIKE ?)
    ORDER BY t.repetition_score DESC, t.created_at DESC
    LIMIT ?
  `).bind(q, q, q, q, limit).all();

  return json({ truths: (rows.results || []).map(mapTruth) });
}

export async function createTruth(request, env, helpers) {
  const { readJson, cleanText, cleanId, json, requireUser, makeId } = helpers;
  const userId = requireUser(request);
  await safeRateLimit(request, env, `truth:${ip(request)}`, 12, 3600000);
  const body = await readJson(request);
  const statement = cleanText(body.statement || '', 500);
  if (statement.length < 4) return json({ error: 'TRUTH_TOO_SHORT' }, 400);

  await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at) VALUES (?, ?, ?)`)
    .bind(userId, `anon-${userId.slice(-6)}`, Date.now())
    .run();

  const normalized = normalize(statement);
  const now = Date.now();
  const existing = await env.DB.prepare(`SELECT * FROM truths WHERE normalized_statement=?`).bind(normalized).first();

  if (existing) return repeatExistingTruth(env, json, existing.id, now);

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
      cleanText(body.category || 'general', 80),
      cleanText(body.origin || 'unknown', 120),
      cleanText(body.truthType || body.truth_type || 'common', 60),
      cleanText(body.confidenceLabel || body.confidence_label || 'claimed', 60),
      1,
      0,
      cleanId(body.linkedClaimId || body.linked_claim_id || ''),
      now,
      now,
      'review'
    ).run();
  } catch (err) {
    if (!isUniqueConstraintError(err)) throw err;
    const raced = await env.DB.prepare(`SELECT id FROM truths WHERE normalized_statement=?`).bind(normalized).first();
    if (!raced?.id) throw err;
    return repeatExistingTruth(env, json, raced.id, now);
  }

  const row = await env.DB.prepare(`SELECT t.*, u.handle FROM truths t LEFT JOIN users u ON u.id=t.user_id WHERE t.id=?`).bind(id).first();
  return json({ ok: true, truth: mapTruth(row) });
}

async function repeatExistingTruth(env, json, truthId, now = Date.now()) {
  await env.DB.prepare(`UPDATE truths SET repetition_score=repetition_score+1, updated_at=? WHERE id=?`).bind(now, truthId).run();
  const row = await env.DB.prepare(`SELECT t.*, u.handle FROM truths t LEFT JOIN users u ON u.id=t.user_id WHERE t.id=?`).bind(truthId).first();
  return json({ ok: true, repeated: true, truth: mapTruth(row) });
}

function isUniqueConstraintError(err) {
  const message = String(err && err.message ? err.message : err).toLowerCase();
  return message.includes('unique') || message.includes('constraint') || message.includes('constraint failed');
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
    updatedAt: t.updated_at,
    handle: t.handle || 'anon'
  };
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

function normalize(v) {
  return meaningKey(v);
}
