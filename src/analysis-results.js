export async function addAnalysisResult(request, env, helpers) {
  const { readJson, cleanId, cleanText, json, requireUser, makeId } = helpers;
  const userId = requireUser(request);
  const body = await readJson(request);
  const claimId = cleanId(body.claimId || body.claim_id || '');
  if (!claimId) return json({ error: 'CLAIM_ID_REQUIRED' }, 400);

  const raw = body.analysis || body.result || body.raw || body;
  const analysis = typeof raw === 'string' ? safeParse(raw) : raw;
  if (!analysis || typeof analysis !== 'object') return json({ error: 'BAD_ANALYSIS_JSON' }, 400);

  const claim = await env.DB.prepare(`SELECT id FROM claims WHERE id=?`).bind(claimId).first();
  if (!claim) return json({ error: 'CLAIM_NOT_FOUND' }, 404);

  await env.DB.prepare(`INSERT OR IGNORE INTO users (id, handle, created_at) VALUES (?, ?, ?)`)
    .bind(userId, `anon-${userId.slice(-6)}`, Date.now())
    .run();

  const now = Date.now();
  const id = makeId('anl');
  const verdict = cleanText(analysis.verdict || '', 80);
  const evidenceScore = clampNum(analysis.evidence_score, 0, 100);
  const testability = clampNum(analysis.testability, 0, 100);
  const survivability = clampNum(analysis.survivability, 0, 100);

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
    cleanText(body.source || 'aip-user', 40),
    verdict,
    evidenceScore,
    testability,
    survivability,
    JSON.stringify(asArray(analysis.strongest_support)),
    JSON.stringify(asArray(analysis.strongest_pressure)),
    JSON.stringify(asArray(analysis.missing_tests)),
    cleanText(analysis.plain_language_summary || '', 1200),
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
    evidenceScore: a.evidence_score || 0,
    testability: a.testability || 0,
    survivability: a.survivability || 0,
    strongestSupport: safeParse(a.strongest_support_json) || [],
    strongestPressure: safeParse(a.strongest_pressure_json) || [],
    missingTests: safeParse(a.missing_tests_json) || [],
    plainLanguageSummary: a.plain_language_summary || '',
    raw: safeParse(a.raw_json) || null,
    createdAt: a.created_at,
    handle: a.handle || 'anon'
  };
}

function safeParse(v) {
  try { return JSON.parse(v); } catch { return null; }
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

function clampNum(v, min, max) {
  const n = Number(v || 0);
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));
}
