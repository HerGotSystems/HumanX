export async function addAnalysisResult(request, env, helpers) {
  const { readJson, cleanId, cleanText, json, requireUser, makeId } = helpers;
  const userId = await requireUser(request);
  await safeRateLimit(request, env, `analysis:${ip(request)}`, 20, 3600000);
  const body = await readJson(request);
  const claimId = cleanId(body.claimId || body.claim_id || '');
  if (!claimId) return json({ error: 'CLAIM_ID_REQUIRED' }, 400);

  const raw = body.analysis || body.result || body.raw || body;
  const analysis = typeof raw === 'string' ? safeParse(raw) : raw;
  if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis)) return json({ error: 'BAD_ANALYSIS_JSON' }, 400);

  const claim = await env.DB.prepare(`SELECT id FROM claims WHERE id=?`).bind(claimId).first();
  if (!claim) return json({ error: 'CLAIM_NOT_FOUND' }, 404);

  await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at) VALUES (?, ?, ?)`)
    .bind(userId, `anon-${userId.slice(-6)}`, Date.now())
    .run();

  const now = Date.now();
  const id = makeId('anl');
  const verdict = cleanText(analysis.verdict || '', 80);
  const evidenceScore = clampNum(analysis.evidence_score ?? analysis.evidenceScore, 0, 100);
  const testability = clampNum(analysis.testability, 0, 100);
  const survivability = clampNum(analysis.survivability, 0, 100);
  const strongestSupport = analysis.strongest_support ?? analysis.strongestSupport;
  const strongestPressure = analysis.strongest_pressure ?? analysis.strongestPressure;
  const missingTests = analysis.missing_tests ?? analysis.missingTests;
  const plainLanguageSummary = analysis.plain_language_summary ?? analysis.plainLanguageSummary ?? '';

  const hasMeaningfulAnalysis = Boolean(
    verdict ||
    analysis.evidence_score !== undefined || analysis.evidenceScore !== undefined ||
    analysis.testability !== undefined ||
    analysis.survivability !== undefined ||
    strongestSupport !== undefined ||
    strongestPressure !== undefined ||
    missingTests !== undefined ||
    plainLanguageSummary
  );
  if (!hasMeaningfulAnalysis) return json({ error: 'ANALYSIS_SHAPE_REQUIRED', message: 'Analysis must include verdict, scores, support, pressure, missing tests, or summary.' }, 400);

  await env.DB.prepare(`
    INSERT INTO analysis_results (
      id,claim_id,user_id,source,verdict,evidence_score,testability,survivability,
      strongest_support_json,strongest_pressure_json,missing_tests_json,
      plain_language_summary,raw_json,created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    id,
    claimId,
    userId,
    cleanText(body.source || 'runpack-user', 40),
    verdict,
    evidenceScore,
    testability,
    survivability,
    JSON.stringify(asArray(strongestSupport)),
    JSON.stringify(asArray(strongestPressure)),
    JSON.stringify(asArray(missingTests)),
    cleanText(plainLanguageSummary, 1200),
    JSON.stringify(analysis),
    now
  ).run();

  const row = await env.DB.prepare(`SELECT * FROM analysis_results WHERE id=?`).bind(id).first();
  return json({ ok: true, analysis: mapAnalysis(row) });
}

export async function listAnalysisForClaim(env, claimId) {
  const rows = await env.DB.prepare(`
    SELECT a.*, u.handle
    FROM analysis_results a
    LEFT JOIN users u ON u.id=a.user_id
    WHERE a.claim_id=?
    ORDER BY a.created_at DESC
  `).bind(claimId).all();
  return (rows.results || []).map(mapAnalysis);
}

export function mapAnalysis(a) {
  if (!a) return null;
  return {
    id: a.id,
    claimId: a.claim_id,
    source: a.source,
    verdict: a.verdict,
    evidenceScore: a.evidence_score ?? 0,
    testability: a.testability ?? 0,
    survivability: a.survivability ?? 0,
    strongestSupport: safeParse(a.strongest_support_json) || [],
    strongestPressure: safeParse(a.strongest_pressure_json) || [],
    missingTests: safeParse(a.missing_tests_json) || [],
    plainLanguageSummary: a.plain_language_summary || '',
    raw: safeParse(a.raw_json) || null,
    createdAt: a.created_at,
    handle: a.handle || 'anon'
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

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v === undefined || v === null || v === '') return [];
  return [v];
}

function clampNum(v, min, max) {
  const n = Number(v ?? 0);
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));
}
