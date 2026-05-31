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
  const body = await readJson(request);
  const statement = cleanText(body.statement || '', 500);
  if (statement.length < 4) return json({ error: 'TRUTH_TOO_SHORT' }, 400);

  await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at) VALUES (?, ?, ?)`)
    .bind(userId, `anon-${userId.slice(-6)}`, Date.now())
    .run();

  const normalized = normalize(statement);
  const now = Date.now();
  const existing = await env.DB.prepare(`SELECT * FROM truths WHERE normalized_statement=?`).bind(normalized).first();

  if (existing) {
    await env.DB.prepare(`UPDATE truths SET repetition_score=repetition_score+1, updated_at=? WHERE id=?`).bind(now, existing.id).run();
    const row = await env.DB.prepare(`SELECT t.*, u.handle FROM truths t LEFT JOIN users u ON u.id=t.user_id WHERE t.id=?`).bind(existing.id).first();
    return json({ ok: true, repeated: true, truth: mapTruth(row) });
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

  const row = await env.DB.prepare(`SELECT t.*, u.handle FROM truths t LEFT JOIN users u ON u.id=t.user_id WHERE t.id=?`).bind(id).first();
  return json({ ok: true, truth: mapTruth(row) });
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

function normalize(v) {
  return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
