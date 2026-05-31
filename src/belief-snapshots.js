export async function saveBeliefSnapshot(request, env, helpers) {
  const { readJson, cleanId, cleanText, json, requireUser, makeId } = helpers;
  const userId = requireUser(request);
  await safeRateLimit(request, env, `belief-snapshot:${ip(request)}`, 20, 3600000);
  const body = await readJson(request);
  const raw = body.snapshot || body.result || body.raw || body;
  const snapshot = typeof raw === 'string' ? safeParse(raw) : raw;
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return json({ error: 'BAD_BELIEF_SNAPSHOT' }, 400);

  await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at) VALUES (?, ?, ?)`)
    .bind(userId, `anon-${userId.slice(-6)}`, Date.now())
    .run();

  const dimensions = snapshot.dimensions && typeof snapshot.dimensions === 'object' ? snapshot.dimensions : {};
  const topBeliefs = Array.isArray(snapshot.topBeliefs) ? snapshot.topBeliefs : Array.isArray(snapshot.top_beliefs) ? snapshot.top_beliefs : [];
  const contradictions = Array.isArray(snapshot.contradictions) ? snapshot.contradictions : [];
  const stressPoints = Array.isArray(snapshot.stressPoints) ? snapshot.stressPoints : Array.isArray(snapshot.stress_points) ? snapshot.stress_points : [];
  const profile = snapshot.profile && typeof snapshot.profile === 'object' ? snapshot.profile : {};

  const now = Date.now();
  const id = makeId('bsn');
  const label = cleanText(body.label || snapshot.label || snapshot.title || 'Belief snapshot', 120);
  const engineVersion = cleanText(body.engineVersion || body.engine_version || snapshot.engineVersion || snapshot.engine_version || 'belief-engine-v1', 80);
  const source = cleanText(body.source || snapshot.source || 'belief-engine', 60);
  const dominantPattern = cleanText(snapshot.dominantPattern || snapshot.dominant_pattern || profile.dominantPattern || profile.name || '', 120);
  const summary = cleanText(snapshot.summary || snapshot.plainLanguageSummary || snapshot.plain_language_summary || profile.summary || '', 1600);
  const beliefCount = Number.isFinite(Number(snapshot.beliefCount ?? snapshot.belief_count)) ? Number(snapshot.beliefCount ?? snapshot.belief_count) : topBeliefs.length;
  const contradictionCount = Number.isFinite(Number(snapshot.contradictionCount ?? snapshot.contradiction_count)) ? Number(snapshot.contradictionCount ?? snapshot.contradiction_count) : contradictions.length;
  const stabilityScore = clampNum(snapshot.stabilityScore ?? snapshot.stability_score, 0, 100);
  const opennessScore = clampNum(snapshot.opennessScore ?? snapshot.openness_score, 0, 100);
  const pressureScore = clampNum(snapshot.pressureScore ?? snapshot.pressure_score, 0, 100);

  await env.DB.prepare(`
    INSERT INTO belief_snapshots (
      id,user_id,label,engine_version,source,dominant_pattern,summary,
      belief_count,contradiction_count,stability_score,openness_score,pressure_score,
      dimensions_json,top_beliefs_json,contradictions_json,stress_points_json,raw_json,created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    id,
    userId,
    label,
    engineVersion,
    source,
    dominantPattern,
    summary,
    beliefCount,
    contradictionCount,
    stabilityScore,
    opennessScore,
    pressureScore,
    JSON.stringify(dimensions),
    JSON.stringify(topBeliefs),
    JSON.stringify(contradictions),
    JSON.stringify(stressPoints),
    JSON.stringify(snapshot),
    now
  ).run();

  const row = await env.DB.prepare(`SELECT * FROM belief_snapshots WHERE id=?`).bind(id).first();
  return json({ ok: true, snapshot: mapBeliefSnapshot(row) });
}

export async function listBeliefSnapshots(request, env, helpers) {
  const { json, requireUser } = helpers;
  const userId = requireUser(request);
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 30)));
  const rows = await env.DB.prepare(`
    SELECT bs.*, u.handle
    FROM belief_snapshots bs
    LEFT JOIN users u ON u.id=bs.user_id
    WHERE bs.user_id=?
    ORDER BY bs.created_at DESC
    LIMIT ?
  `).bind(userId, limit).all();
  return json({ snapshots: (rows.results || []).map(mapBeliefSnapshot) });
}

export function mapBeliefSnapshot(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label || 'Belief snapshot',
    engineVersion: row.engine_version || '',
    source: row.source || '',
    dominantPattern: row.dominant_pattern || '',
    summary: row.summary || '',
    beliefCount: row.belief_count || 0,
    contradictionCount: row.contradiction_count || 0,
    stabilityScore: row.stability_score || 0,
    opennessScore: row.openness_score || 0,
    pressureScore: row.pressure_score || 0,
    dimensions: safeParse(row.dimensions_json) || {},
    topBeliefs: safeParse(row.top_beliefs_json) || [],
    contradictions: safeParse(row.contradictions_json) || [],
    stressPoints: safeParse(row.stress_points_json) || [],
    raw: safeParse(row.raw_json) || null,
    createdAt: row.created_at,
    handle: row.handle || 'anon'
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

function safeParse(v) {
  try { return JSON.parse(v); } catch { return null; }
}

function clampNum(v, min, max) {
  const n = Number(v || 0);
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));
}
